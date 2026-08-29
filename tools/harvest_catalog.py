#!/usr/bin/env python3
"""Harvest real product data from the four target Israeli baby chains.

Per D22 the catalog is a live-harvested seed: we read each chain's public
Shopify ``products.json`` once, normalise it, and write a versioned snapshot.
The application then seeds from the snapshot and has no runtime dependency on
any chain.

Usage:
    python3 tools/harvest_catalog.py [--pages 4] [--per-chain 45]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "services" / "api" / "seed" / "catalog_snapshot.json"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

CHAINS = [
    {"slug": "shilav", "name_he": "שילב", "host": "www.shilav.co.il"},
    {"slug": "motsetsim", "name_he": "מוצצים", "host": "motsesim.co.il"},
    {"slug": "agalis", "name_he": "עגליס", "host": "www.agalease-baby.co.il"},
    {"slug": "baby-star", "name_he": "בייבי סטאר", "host": "www.baby-star.co.il"},
]

# The six PRD categories. A chain's own product_type is far more granular and
# wildly inconsistent between chains, so it is mapped rather than trusted.
CATEGORIES = ["linens", "feeding", "mobility", "bath", "clothing", "toys"]

CATEGORY_LABELS_HE = {
    "linens": "לינה",
    "feeding": "האכלה",
    "mobility": "ניידות",
    "bath": "רחצה והחתלה",
    "clothing": "ביגוד",
    "toys": "צעצועים",
}

# A toy that mentions a stroller is still a toy. Without this pre-pass,
# "עגלת צעצועים" and "רעשן תליה לעגלה" match the mobility keyword "עגל" and
# crowd real strollers out of the mobility bucket.
STRONG_TOY_MARKERS = (
    "צעצוע", "רעשן", "בובה", "בובת", "פאזל", "נשכן", "מובייל", "קרוסל",
    "משחק", "לוח ציור", "קוביות", "דמות", "פעילות מוזיקלי",
)

# Ordered: the first matching keyword wins, so put the specific before the general.
CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (
        "mobility",
        (
            "עגלת תינוק", "עגלה משולבת", "עגלת טיול", "עגלות", "עגלה", "טיולון",
            "סלקל", "מושב בטיחות", "מושבי בטיחות", "כיסא בטיחות", "כיסאות בטיחות",
            "כסא בטיחות", "בוסטר", "הליכון", "בימבה", "מנשא", "אופני", "קורקינט",
        ),
    ),
    (
        "feeding",
        (
            "הנקה", "האכלה", "בקבוק", "מוצץ", "מוצצים", "משאבת", "משאבות", "כוס",
            "כוסות", "צלחת", "כלי אוכל", "קופסאות אוכל", "כיסא אוכל", "כסא אוכל",
            "סינר", "חימום", "מחמם", "מייבש", "עקרון", "פורמולה", "תמ״ל",
        ),
    ),
    (
        "bath",
        (
            "רחצה", "החתלה", "אמבט", "חיתול", "חיתולים", "מגבת", "תמרוק", "קרם",
            "סבון", "שמפו", "מברשת", "ציפורן", "מדחום", "גזה", "מטליו", "מגבונים",
            "סיר אנטומי", "גמילה", "נזלת",
        ),
    ),
    (
        "linens",
        (
            "מיטת", "מיטה", "עריסה", "לול", "מזרן", "מזרון", "שמיכ", "סדין", "סדינים",
            "ציפית", "כילה", "חיתול טטרה", "מצעים", "טקסטיל", "עיצוב החדר", "מנורת",
            "מוניטור", "אינטרקום", "בייבי מוניטור", "נדנד", "יונק", "שק שינה",
            "מגן ראש", "כרית",
        ),
    ),
    (
        "toys",
        (
            "צעצוע", "משחק", "התפתחות", "משטח פעילות", "אוהל", "בובה", "פאזל", "קוביו",
            "נשכן", "רעשן", "ספר", "מוביל", "קרוסל", "תליון", "מובייל",
        ),
    ),
    (
        "clothing",
        (
            "בגד", "ביגוד", "אוברול", "בגדי גוף", "בודי", "פיג", "גרב", "גרביים",
            "כובע", "נעל", "נעלי", "סרבל", "חליפ", "מכנס", "חולצ", "שמלה", "מעיל",
            "סווטשירט", "טייטס", "כפכפ",
        ),
    ),
]

MIN_AGOROT = 2_000        # 20 ILS. Below this it is an accessory, not a gift.
MAX_AGOROT = 800_000      # 8000 ILS.
MIN_TITLE_LEN = 8
MAX_TITLE_LEN = 160       # Real retailer titles run long; we shorten rather than reject.
DISPLAY_TITLE_MAX = 62    # Fits the card's two-line clamp at 15px Heebo.

# Real Shopify titles cram the whole variant axis into the name, e.g.
# "הזמנה מוקדמת - עגלה משולבת סייבקס מיוס 4 שלדה רוז גולד / ידית חומה / עריסה".
# A registry card needs a short human name, so we keep both.
TITLE_PREFIX_NOISE = (
    "הזמנה מוקדמת",
    "מבצע",
    "חדש",
    "אקסקלוסיבי",
    "פרי אורדר",
    "pre order",
)


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def fetch_json(url: str, *, retries: int = 3) -> dict[str, Any] | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                if resp.status != 200:
                    log(f"    HTTP {resp.status} for {url}")
                    return None
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            log(f"    attempt {attempt}/{retries} failed for {url}: {exc}")
            if attempt < retries:
                time.sleep(1.5 * attempt)
    return None


def to_agorot(price: str | float | None) -> int | None:
    if price in (None, ""):
        return None
    try:
        return int(round(float(price) * 100))
    except (TypeError, ValueError):
        return None


def classify(product_type: str, title: str, tags: list[str]) -> str | None:
    haystack = " ".join([product_type or "", title or "", " ".join(tags or [])])

    # Toys first, so a toy stroller does not become a stroller.
    if any(marker in haystack for marker in STRONG_TOY_MARKERS):
        return "toys"

    for category, keywords in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in haystack:
                return category
    return None


def clean_title(raw: str) -> str:
    title = re.sub(r"\s+", " ", (raw or "").strip())
    # Chains suffix titles with SKU-ish noise and marketing tails.
    title = re.sub(r"\s*[-–|]\s*(מבצע|חדש|אחרון במלאי|משלוח חינם)\s*$", "", title)
    return title.strip()


def display_title(source: str) -> str:
    """Derive a short card name from a retailer's full product title.

    Retailer titles encode the variant axis, so cutting at the first separator
    keeps the product and drops the colourway. Nothing here is lossy: the full
    title is retained as source_title.
    """
    title = source

    # Drop a leading marketing prefix such as "הזמנה מוקדמת - ".
    for noise in TITLE_PREFIX_NOISE:
        pattern = rf"^\s*{re.escape(noise)}\s*[-–|:]\s*"
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)

    # " / " separates variant axes; everything after the first one is colourway.
    if " / " in title:
        title = title.split(" / ")[0]

    title = title.strip(" -–|,")

    # Still long: cut at the last word boundary that fits, never mid-word,
    # and never leave a dangling separator. Hebrew does not hyphenate.
    if len(title) > DISPLAY_TITLE_MAX:
        cut = title[: DISPLAY_TITLE_MAX + 1]
        if " " in cut:
            cut = cut[: cut.rfind(" ")]
        title = cut.strip(" -–|,")

    return title or source[:DISPLAY_TITLE_MAX]


def normalise(product: dict[str, Any], chain: dict[str, str]) -> dict[str, Any] | None:
    source_title = clean_title(product.get("title", ""))
    if not (MIN_TITLE_LEN <= len(source_title) <= MAX_TITLE_LEN):
        return None
    title = display_title(source_title)
    if len(title) < MIN_TITLE_LEN:
        return None

    images = product.get("images") or []
    if not images:
        return None
    image = images[0]
    image_url = (image.get("src") or "").split("?")[0]
    if not image_url:
        return None

    variants = product.get("variants") or []
    if not variants:
        return None
    variant = variants[0]

    agorot = to_agorot(variant.get("price"))
    if agorot is None or not (MIN_AGOROT <= agorot <= MAX_AGOROT):
        return None

    product_type = (product.get("product_type") or "").strip()
    tags = product.get("tags") or []
    category = classify(product_type, source_title, tags)
    if category is None:
        return None

    handle = product.get("handle") or ""

    # Shopify reports variant availability, and we deliberately drop it (D26).
    # A stock flag captured once is stale within the hour, and a wrong
    # "אזל מהמלאי" costs the same trust as a wrong price.
    return {
        "chain_slug": chain["slug"],
        "chain_name_he": chain["name_he"],
        "external_id": str(product.get("id")),
        "title": title,
        "source_title": source_title if source_title != title else None,
        "handle": handle,
        "canonical_url": f"https://{chain['host']}/products/{handle}",
        "vendor": (product.get("vendor") or "").strip() or None,
        "source_product_type": product_type or None,
        "category": category,
        "category_label_he": CATEGORY_LABELS_HE[category],
        "price_agorot": agorot,
        "compare_at_agorot": to_agorot(variant.get("compare_at_price")),
        "sku": (variant.get("sku") or "").strip() or None,
        "image_url": image_url,
        "image_width": image.get("width"),
        "image_height": image.get("height"),
    }


def harvest_chain(chain: dict[str, str], pages: int) -> tuple[list[dict[str, Any]], Counter]:
    log(f"  {chain['name_he']} ({chain['host']})")
    seen_ids: set[str] = set()
    seen_titles: set[str] = set()
    items: list[dict[str, Any]] = []
    unmapped: Counter = Counter()

    for page in range(1, pages + 1):
        url = f"https://{chain['host']}/products.json?limit=250&page={page}"
        payload = fetch_json(url)
        if not payload:
            break
        products = payload.get("products") or []
        if not products:
            break

        for product in products:
            pid = str(product.get("id"))
            if pid in seen_ids:
                continue
            seen_ids.add(pid)

            item = normalise(product, chain)
            if item is None:
                ptype = (product.get("product_type") or "(empty)").strip()
                if product.get("images") and (product.get("variants") or [{}])[0].get("price"):
                    unmapped[ptype] += 1
                continue

            title_key = item["title"].lower()
            if title_key in seen_titles:
                continue
            seen_titles.add(title_key)
            items.append(item)

        log(f"    page {page}: {len(products)} raw, {len(items)} kept so far")
        time.sleep(0.4)

    return items, unmapped


# Bands chosen to match the PRD's guest filter chips, so every chip has items:
# עד ₪100, ₪100–₪300, מעל ₪300, plus a premium band for group-gift candidates.
PRICE_BANDS: tuple[tuple[str, int, int], ...] = (
    ("premium", 100_000, MAX_AGOROT),   # 1000+ ILS: the group-gift candidates
    ("high", 30_000, 100_000),          # 300-1000 ILS
    ("mid", 10_000, 30_000),            # 100-300 ILS
    ("budget", MIN_AGOROT, 10_000),     # 20-100 ILS
)


def curate(items: list[dict[str, Any]], per_chain: int) -> list[dict[str, Any]]:
    """Spread the selection across categories and price bands.

    Two traps this avoids. A naive head-of-list slice returns 40 babygros,
    because chains order by recency and clothing dominates. And popping each
    band in ascending order caps the whole catalog around the band floor, which
    silently removes every expensive item the group-gift flow depends on.
    """
    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        by_category[item["category"]].append(item)

    for category, bucket in by_category.items():
        bands: list[list[dict[str, Any]]] = []
        for _, low, high in PRICE_BANDS:
            in_band = [i for i in bucket if low <= i["price_agorot"] < high]
            # Most expensive first within each band: on a registry the
            # substantial version of a thing is the more interesting gift.
            in_band.sort(key=lambda i: -i["price_agorot"])
            bands.append(in_band)

        interleaved: list[dict[str, Any]] = []
        while any(bands):
            for band in bands:
                if band:
                    interleaved.append(band.pop(0))
        by_category[category] = interleaved

    selected: list[dict[str, Any]] = []
    order = [c for c in CATEGORIES if by_category.get(c)]
    idx = 0
    while len(selected) < per_chain and order:
        category = order[idx % len(order)]
        bucket = by_category.get(category)
        if bucket:
            selected.append(bucket.pop(0))
        else:
            order = [c for c in order if c != category]
            if not order:
                break
            continue
        idx += 1
    return selected


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pages", type=int, default=4, help="pages of 250 products per chain")
    parser.add_argument("--per-chain", type=int, default=45, help="curated items kept per chain")
    args = parser.parse_args()

    log("Harvesting catalog (D22: live-harvested seed)\n")

    chains_out: list[dict[str, Any]] = []
    all_items: list[dict[str, Any]] = []
    coverage: dict[str, Any] = {}

    for chain in CHAINS:
        harvested, unmapped = harvest_chain(chain, args.pages)
        if not harvested:
            log(f"    WARNING: nothing harvested from {chain['host']}")
        selected = curate(harvested, args.per_chain)
        cats = Counter(i["category"] for i in selected)
        log(
            f"    harvested {len(harvested)}, curated {len(selected)} "
            f"({', '.join(f'{CATEGORY_LABELS_HE[c]}={n}' for c, n in cats.most_common())})"
        )
        if unmapped:
            log(f"    top unmapped product_type: {', '.join(f'{t}={n}' for t, n in unmapped.most_common(5))}")
        log("")

        chains_out.append(
            {
                "slug": chain["slug"],
                "name_he": chain["name_he"],
                "site_url": f"https://{chain['host']}",
                "harvested_count": len(harvested),
                "curated_count": len(selected),
            }
        )
        coverage[chain["slug"]] = {CATEGORY_LABELS_HE[c]: n for c, n in cats.most_common()}
        all_items.extend(selected)

    if not all_items:
        log("FAILED: no items harvested from any chain. Not writing a snapshot.")
        return 1

    snapshot = {
        # 2 dropped in_stock and priority_hint from every item (D26, D27).
        "schema_version": 2,
        "harvested_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "public Shopify products.json per chain, no auth",
        "note": (
            "Real product data, harvested once per D22. The application seeds from this "
            "file and never calls a chain at runtime. Re-run tools/harvest_catalog.py to refresh."
        ),
        "categories": [{"key": k, "label_he": CATEGORY_LABELS_HE[k]} for k in CATEGORIES],
        "chains": chains_out,
        "coverage": coverage,
        "item_count": len(all_items),
        "items": all_items,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    log(f"Wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    log(f"  {len(all_items)} items across {len(chains_out)} chains")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
