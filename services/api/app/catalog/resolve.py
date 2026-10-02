"""Turn a pasted product URL into a card the registry can snapshot."""

from __future__ import annotations

import ipaddress
import json
import re
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated
from urllib.parse import parse_qsl, unquote, urlsplit

from fastapi import Depends

from app.catalog.product_text import classify, clean_title, display_title
from app.catalog.schemas import (
    CategoryName,
    ResolveNeedsVariant,
    ResolveProduct,
    ResolveResult,
    ResolveUnresolved,
    ResolveVariantOption,
    UnresolvedReason,
)

Fetcher = Callable[[str], bytes]

MIN_PRICE_AGOROT = 100
MAX_PRICE_AGOROT = 10_000_000

_TITLE_LIMIT = 200
_SOURCE_LIMIT = 300
_IMAGE_LIMIT = 500
_ID_LIMIT = 64
_LABEL_LIMIT = 200
_TIMEOUT_SECONDS = 8
_MAX_BYTES = 1_000_000
_USER_AGENT = "il-wishlist-registry paste"
_ACCEPT = "application/json, text/javascript"
_CDN_HOST = "cdn.shopify.com"
_HANDLE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,200}$")
_JS_PATH = re.compile(r"^/products/[A-Za-z0-9][A-Za-z0-9_-]{0,200}\.js$")
_LOCALE = re.compile(r"^[a-z]{2}$")


class FetchFailed(Exception):
    pass


class _BadDocument(Exception):
    pass


@dataclass(frozen=True)
class _Chain:
    harvest_host: str
    slug: str
    name_he: str


_CHAINS: dict[str, _Chain] = {
    "shilav.co.il": _Chain("www.shilav.co.il", "shilav", "שילב"),
    "www.shilav.co.il": _Chain("www.shilav.co.il", "shilav", "שילב"),
    "motsesim.co.il": _Chain("motsesim.co.il", "motsetsim", "מוצצים"),
    "www.motsesim.co.il": _Chain("motsesim.co.il", "motsetsim", "מוצצים"),
    "agalease-baby.co.il": _Chain("www.agalease-baby.co.il", "agalis", "עגליס"),
    "www.agalease-baby.co.il": _Chain("www.agalease-baby.co.il", "agalis", "עגליס"),
    "baby-star.co.il": _Chain("www.baby-star.co.il", "baby-star", "בייבי סטאר"),
    "www.baby-star.co.il": _Chain("www.baby-star.co.il", "baby-star", "בייבי סטאר"),
}

_HARVEST_HOSTS = frozenset(chain.harvest_host for chain in _CHAINS.values())


@dataclass(frozen=True)
class _Parsed:
    chain: _Chain
    handle: str
    variant_id: str | None

    @property
    def fetch_url(self) -> str:
        return f"https://{self.chain.harvest_host}/products/{self.handle}.js"

    @property
    def product_url(self) -> str:
        return f"https://{self.chain.harvest_host}/products/{self.handle}"


@dataclass(frozen=True)
class _Variant:
    id: str
    label: str
    price: int | None
    image: str | None


@dataclass(frozen=True)
class _Card:
    chain_slug: str
    chain_name_he: str
    external_id: str
    title: str
    source_title: str | None
    category: CategoryName | None
    product_url: str
    product_image: str | None


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        close = getattr(fp, "close", None)
        if close is not None:
            close()
        raise FetchFailed()

    http_error_301 = http_error_302
    http_error_303 = http_error_302
    http_error_307 = http_error_302
    http_error_308 = http_error_302


def urllib_fetch(url: str) -> bytes:
    if not _is_harvest_js(url):
        raise FetchFailed()
    request = urllib.request.Request(
        url,
        headers={"User-Agent": _USER_AGENT, "Accept": _ACCEPT},
        method="GET",
    )
    opener = urllib.request.build_opener(_NoRedirect)
    try:
        with opener.open(request, timeout=_TIMEOUT_SECONDS) as response:
            status = getattr(response, "status", None)
            if status is None:
                status = getattr(response, "code", None)
            if status != 200:
                raise FetchFailed()
            body = response.read(_MAX_BYTES + 1)
    except FetchFailed:
        raise
    except Exception:
        raise FetchFailed() from None
    if len(body) > _MAX_BYTES:
        raise FetchFailed()
    return body


def get_product_fetcher() -> Fetcher:
    return urllib_fetch


ProductFetcherDep = Annotated[Fetcher, Depends(get_product_fetcher)]


def resolve_paste(
    url: str,
    *,
    fetch: Fetcher,
    variant_id: str | None = None,
) -> ResolveResult:
    trimmed = url.strip()
    parsed = _parse(trimmed)
    if isinstance(parsed, str):
        return ResolveUnresolved(outcome="unresolved", reason=parsed, url=trimmed)
    selected = parsed.variant_id if variant_id is None else variant_id
    try:
        body = fetch(parsed.fetch_url)
    except Exception:
        return ResolveUnresolved(outcome="unresolved", reason="fetch_failed", url=trimmed)
    return _map_document(body, parsed, selected, trimmed)


def _is_harvest_js(url: str) -> bool:
    parts = urlsplit(url)
    host = (parts.hostname or "").lower().rstrip(".")
    return (
        parts.scheme == "https"
        and host in _HARVEST_HOSTS
        and parts.username is None
        and parts.password is None
        and parts.port in {None, 443}
        and not parts.query
        and not parts.fragment
        and _JS_PATH.fullmatch(parts.path) is not None
    )


def _parse(url: str) -> _Parsed | UnresolvedReason:
    parts = urlsplit(url)
    if parts.scheme != "https":
        return "not_https"
    if parts.username is not None or parts.password is not None or "@" in parts.netloc:
        return "unknown_host"
    host = (parts.hostname or "").lower().rstrip(".")
    if not host or _is_ip(host):
        return "unknown_host"
    chain = _CHAINS.get(host)
    if chain is None:
        return "unknown_host"
    handle = _product_handle(parts.path)
    if handle is None:
        return "not_product"
    return _Parsed(chain=chain, handle=handle, variant_id=_variant_query(parts.query))


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return False
    return True


def _product_handle(path: str) -> str | None:
    if not path.startswith("/"):
        return None
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    parts = path.split("/")[1:]
    if not parts or any(part == "" for part in parts):
        return None
    if _LOCALE.fullmatch(parts[0]) and len(parts) > 1 and parts[1] in {"products", "collections"}:
        parts = parts[1:]
    if parts[0] == "collections":
        if len(parts) != 4 or parts[2] != "products" or not parts[1]:
            return None
        parts = parts[2:]
    if len(parts) != 2 or parts[0] != "products":
        return None
    try:
        decoded = unquote(parts[1], errors="strict")
    except UnicodeDecodeError:
        return None
    if _HANDLE.fullmatch(decoded) is None:
        return None
    return decoded


def _variant_query(query: str) -> str | None:
    for key, value in parse_qsl(query, keep_blank_values=True):
        if key == "variant":
            if value.isdigit():
                return value
            return None
    return None


def _map_document(
    body: object,
    parsed: _Parsed,
    selected_id: str | None,
    pasted: str,
) -> ResolveResult:
    try:
        data = _load_json(body)
        title, source_title, cleaned = _titles(data.get("title"))
        card = _Card(
            chain_slug=parsed.chain.slug,
            chain_name_he=parsed.chain.name_he,
            external_id=_digit_id(data.get("id")),
            title=title,
            source_title=source_title,
            category=_category(data, cleaned),
            product_url=parsed.product_url,
            product_image=_normalize_image(data.get("featured_image")),
        )
        variants = _read_variants(data.get("variants"))
    except _BadDocument:
        return ResolveUnresolved(outcome="unresolved", reason="bad_document", url=pasted)
    picked = _pick(card, variants, selected_id)
    if picked is None:
        return ResolveUnresolved(outcome="unresolved", reason="missing_price", url=pasted)
    return picked


def _load_json(body: object) -> dict[str, object]:
    if not isinstance(body, bytes | bytearray):
        raise _BadDocument
    try:
        data = json.loads(bytes(body).decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise _BadDocument from None
    if not isinstance(data, dict):
        raise _BadDocument
    return data


def _titles(raw: object) -> tuple[str, str | None, str]:
    if not isinstance(raw, str):
        raise _BadDocument
    cleaned = clean_title(raw)
    title = display_title(cleaned)[:_TITLE_LIMIT]
    if not title:
        raise _BadDocument
    source = cleaned[:_SOURCE_LIMIT]
    source_title = None if source == title else source
    return title, source_title, cleaned


def _category(data: dict[str, object], title: str) -> CategoryName | None:
    product_type = data.get("product_type")
    if not isinstance(product_type, str):
        product_type = data.get("type")
    if not isinstance(product_type, str):
        product_type = ""
    found = classify(product_type, title, _tags(data.get("tags")))
    if found in {"linens", "feeding", "mobility", "bath", "clothing", "toys"}:
        return found
    return None


def _tags(value: object) -> list[str]:
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    return []


def _read_variants(value: object) -> list[_Variant]:
    if not isinstance(value, list) or not value:
        raise _BadDocument
    variants: list[_Variant] = []
    for item in value:
        if not isinstance(item, dict):
            raise _BadDocument
        variants.append(
            _Variant(
                id=_digit_id(item.get("id")),
                label=_label(item),
                price=_parse_price(item.get("price")),
                image=_normalize_image(item.get("featured_image")),
            )
        )
    return variants


def _digit_id(value: object) -> str:
    if isinstance(value, bool) or isinstance(value, float) or value is None:
        raise _BadDocument
    if isinstance(value, int):
        if value < 0:
            raise _BadDocument
        text = str(value)
    elif isinstance(value, str) and value.isdigit():
        text = value
    else:
        raise _BadDocument
    if not text or len(text) > _ID_LIMIT:
        raise _BadDocument
    return text


def _label(variant: dict[str, object]) -> str:
    title = variant.get("title")
    option1 = variant.get("option1")
    title_text = title.strip() if isinstance(title, str) else ""
    option_text = option1.strip() if isinstance(option1, str) else ""
    label = (
        (option_text or title_text)
        if title_text == "Default Title"
        else (title_text or option_text)
    )
    return (label or "Default Title")[:_LABEL_LIMIT]


def _parse_price(value: object) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise _BadDocument
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        # .js prices are already agorot; a '.' is products.json and must not be scaled.
        if "." in value:
            raise _BadDocument
        if value.isdigit():
            return int(value)
        raise _BadDocument
    raise _BadDocument


def _normalize_image(value: object) -> str | None:
    src = _image_src(value)
    if src is None:
        return None
    if src.startswith("//"):
        src = "https:" + src
    parts = urlsplit(src)
    if parts.username is not None or parts.password is not None or "@" in parts.netloc:
        return None
    if parts.scheme.lower() not in {"http", "https"}:
        return None
    host = (parts.hostname or "").lower().rstrip(".")
    if host != _CDN_HOST or parts.port not in {None, 443}:
        return None
    if not parts.path.startswith("/"):
        return None
    url = f"https://{_CDN_HOST}{parts.path}"
    if len(url) > _IMAGE_LIMIT:
        return None
    return url


def _image_src(value: object) -> str | None:
    if isinstance(value, str):
        text = value.strip()
        return text or None
    if isinstance(value, dict):
        src = value.get("src")
        if isinstance(src, str) and src.strip():
            return src.strip()
    return None


def _pick(
    card: _Card,
    variants: list[_Variant],
    selected_id: str | None,
) -> ResolveProduct | ResolveNeedsVariant | None:
    prices = {variant.price for variant in variants}
    uniform = len(variants) == 1 or (len(prices) == 1 and None not in prices)
    if uniform:
        return _uniform_product(card, variants)
    if selected_id is not None:
        match = next((variant for variant in variants if variant.id == selected_id), None)
        if match is not None:
            return _chosen_product(card, match)
    options = [
        ResolveVariantOption(
            id=variant.id,
            label=variant.label,
            price_agorot=variant.price,
            image_url=variant.image or card.product_image,
        )
        for variant in variants
        if variant.price is not None
    ]
    if not options:
        return None
    return ResolveNeedsVariant(
        outcome="needsVariant",
        chain_slug=card.chain_slug,
        chain_name_he=card.chain_name_he,
        external_id=card.external_id,
        title=card.title,
        source_title=card.source_title,
        category=card.category,
        image_url=card.product_image,
        canonical_url=card.product_url,
        variants=options,
    )


def _uniform_product(card: _Card, variants: list[_Variant]) -> ResolveProduct | None:
    if len(variants) == 1:
        return _chosen_product(card, variants[0])
    price = variants[0].price
    if price is None or not _in_range(price):
        return None
    return _product(
        card,
        price=price,
        image=card.product_image,
        variant_id=None,
        canonical=card.product_url,
    )


def _chosen_product(card: _Card, variant: _Variant) -> ResolveProduct | None:
    if variant.price is None or not _in_range(variant.price):
        return None
    return _product(
        card,
        price=variant.price,
        image=variant.image or card.product_image,
        variant_id=variant.id,
        canonical=f"{card.product_url}?variant={variant.id}",
    )


def _product(
    card: _Card,
    *,
    price: int,
    image: str | None,
    variant_id: str | None,
    canonical: str,
) -> ResolveProduct:
    return ResolveProduct(
        outcome="product",
        chain_slug=card.chain_slug,
        chain_name_he=card.chain_name_he,
        external_id=card.external_id,
        title=card.title,
        source_title=card.source_title,
        category=card.category,
        image_url=image,
        price_agorot=price,
        canonical_url=canonical,
        variant_id=variant_id,
    )


def _in_range(price: int) -> bool:
    return MIN_PRICE_AGOROT <= price <= MAX_PRICE_AGOROT
