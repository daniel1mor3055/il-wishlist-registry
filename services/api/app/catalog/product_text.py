"""Title shortening and keyword category, copied from the harvest rules."""

from __future__ import annotations

import re

STRONG_TOY_MARKERS = (
    "צעצוע",
    "רעשן",
    "בובה",
    "בובת",
    "פאזל",
    "נשכן",
    "מובייל",
    "קרוסל",
    "משחק",
    "לוח ציור",
    "קוביות",
    "דמות",
    "פעילות מוזיקלי",
)

CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (
        "mobility",
        (
            "עגלת תינוק",
            "עגלה משולבת",
            "עגלת טיול",
            "עגלות",
            "עגלה",
            "טיולון",
            "סלקל",
            "מושב בטיחות",
            "מושבי בטיחות",
            "כיסא בטיחות",
            "כיסאות בטיחות",
            "כסא בטיחות",
            "בוסטר",
            "הליכון",
            "בימבה",
            "מנשא",
            "אופני",
            "קורקינט",
        ),
    ),
    (
        "feeding",
        (
            "הנקה",
            "האכלה",
            "בקבוק",
            "מוצץ",
            "מוצצים",
            "משאבת",
            "משאבות",
            "כוס",
            "כוסות",
            "צלחת",
            "כלי אוכל",
            "קופסאות אוכל",
            "כיסא אוכל",
            "כסא אוכל",
            "סינר",
            "חימום",
            "מחמם",
            "מייבש",
            "עקרון",
            "פורמולה",
            "תמ״ל",
        ),
    ),
    (
        "bath",
        (
            "רחצה",
            "החתלה",
            "אמבט",
            "חיתול",
            "חיתולים",
            "מגבת",
            "תמרוק",
            "קרם",
            "סבון",
            "שמפו",
            "מברשת",
            "ציפורן",
            "מדחום",
            "גזה",
            "מטליו",
            "מגבונים",
            "סיר אנטומי",
            "גמילה",
            "נזלת",
        ),
    ),
    (
        "linens",
        (
            "מיטת",
            "מיטה",
            "עריסה",
            "לול",
            "מזרן",
            "מזרון",
            "שמיכ",
            "סדין",
            "סדינים",
            "ציפית",
            "כילה",
            "חיתול טטרה",
            "מצעים",
            "טקסטיל",
            "עיצוב החדר",
            "מנורת",
            "מוניטור",
            "אינטרקום",
            "בייבי מוניטור",
            "נדנד",
            "יונק",
            "שק שינה",
            "מגן ראש",
            "כרית",
        ),
    ),
    (
        "toys",
        (
            "צעצוע",
            "משחק",
            "התפתחות",
            "משטח פעילות",
            "אוהל",
            "בובה",
            "פאזל",
            "קוביו",
            "נשכן",
            "רעשן",
            "ספר",
            "מוביל",
            "קרוסל",
            "תליון",
            "מובייל",
        ),
    ),
    (
        "clothing",
        (
            "בגד",
            "ביגוד",
            "אוברול",
            "בגדי גוף",
            "בודי",
            "פיג",
            "גרב",
            "גרביים",
            "כובע",
            "נעל",
            "נעלי",
            "סרבל",
            "חליפ",
            "מכנס",
            "חולצ",
            "שמלה",
            "מעיל",
            "סווטשירט",
            "טייטס",
            "כפכפ",
        ),
    ),
]

DISPLAY_TITLE_MAX = 62

TITLE_PREFIX_NOISE = (
    "הזמנה מוקדמת",
    "מבצע",
    "חדש",
    "אקסקלוסיבי",
    "פרי אורדר",
    "pre order",
)

_HYPHEN = "-"
_EN_DASH = "\u2013"
_TITLE_SEPARATORS = f"{_HYPHEN}{_EN_DASH}|"
_TITLE_TRIM = f" {_HYPHEN}{_EN_DASH}|,"


def classify(product_type: str, title: str, tags: list[str]) -> str | None:
    haystack = " ".join([product_type or "", title or "", " ".join(tags or [])])
    if any(marker in haystack for marker in STRONG_TOY_MARKERS):
        return "toys"
    for category, keywords in CATEGORY_KEYWORDS:
        for keyword in keywords:
            if keyword in haystack:
                return category
    return None


def clean_title(raw: str) -> str:
    title = re.sub(r"\s+", " ", (raw or "").strip())
    title = re.sub(
        rf"\s*[{_TITLE_SEPARATORS}]\s*"
        rf"(מבצע|חדש|אחרון במלאי|משלוח חינם)\s*$",
        "",
        title,
    )
    return title.strip()


def display_title(source: str) -> str:
    title = source
    for noise in TITLE_PREFIX_NOISE:
        pattern = rf"^\s*{re.escape(noise)}\s*[{_TITLE_SEPARATORS}:]\s*"
        title = re.sub(pattern, "", title, flags=re.IGNORECASE)
    if " / " in title:
        title = title.split(" / ")[0]
    title = title.strip(_TITLE_TRIM)
    if len(title) > DISPLAY_TITLE_MAX:
        cut = title[: DISPLAY_TITLE_MAX + 1]
        if " " in cut:
            cut = cut[: cut.rfind(" ")]
        title = cut.strip(_TITLE_TRIM)
    return title or source[:DISPLAY_TITLE_MAX]
