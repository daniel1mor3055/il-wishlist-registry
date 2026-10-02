# Integrator brief

## Goals

Easy means a pasted product URL becomes a registry snapshot with no shop work (D18, P2). The shop already publishes the document. We read it.

At add time the item copies chain identity, title, image URL, price in agorot, and a canonical buy URL. The guest handoff already opens that URL. We never checkout (D11) and we never store stock (D26).

The seed stays the browse catalog. `catalog_snapshot.json` holds 45 curated items per chain from a 2026-08-28 harvest (`harvested_count` about 1,050, then cut). It is the wrong index for an arbitrary paste.

## Must-haves for v1 design

One pipeline: parse the paste, GET a URL we build, map Shopify `.js` onto the existing snapshot fields, re-fetch on save. Anything else opens the manual card.

**Parse, then build the request.** Accept `http` or `https`. Allowlist apex and `www` for `shilav.co.il`, `motsesim.co.il`, `agalease-baby.co.il`, `baby-star.co.il`, then call the harvest host (`www` on three, apex on Motsesim). Take the handle from `/products/{handle}`, including a `/collections/{x}/products/{handle}` prefix. Percent-decode once. Keep `variant` only when it is all digits. Drop `utm_*`, `fbclid`, `gclid`, every other query, and the fragment. Reject userinfo, IP hosts, and non-product paths (home, collection, cart, Shilav `/pages/baby-registry`).

**One GET.** `https://{harvest host}/products/{handle}.js`, browser `Accept`, short timeout, size cap, redirects only if the final host is still that chain. This is a different document from collection `products.json`.

Checked 2026-10-02, one request per chain, handles from the seed. Shilav, Motsesim, and Agalis returned `200` `text/javascript`. Variant `price` was an integer equal to seed `price_agorot` (449000, 449000, 179900). Images were protocol-relative `//cdn.shopify.com/...?v=`. Baby Star handle `8319867584559` returned 404; no second try, so that host's `.js` route is unproven. Harvest and D22 only prove `products.json`, where price is a decimal string and `to_agorot` multiplies by 100. Use the `.js` integer as agorot. Ignore `available` (D26). Leave `/products/{handle}.json` unused; its price shape was not measured, and a second parser will drift.

**Map onto fields the item already copies.** `id` → `external_id`. Host → `chain_slug` / `chain_name_he`. Full `title` → `source_title`; the harvest display-title cut → `title`. Selected variant `price` → `price_agorot` (selling price, ignore `compare_at_price`). Image: variant `featured_image`, else product `featured_image`; force `https`, strip the query; hotlink. `cdn.shopify.com` is already the product image host. Stored buy URL: `https://{harvest host}/products/{handle}` plus `?variant={id}` when one was chosen. Keyword map may set `category`. Null is legal on `registry_items` and illegal on `catalog_items`, so a paste writes a registry item and never a catalog row.

**Variant from the same payload.** One variant, or `price_varies` false: take it. `price_varies` true and no variant id: return ids, labels, and prices and wait for a pick. Harvest's `variants[0]` is a catalog sample. A wrong colourway price is the same trust failure D26 names for a wrong stock flag.

**Save re-fetches.** Same rule as catalog add: the browser does not supply price or image. Preview GET, then save GET, then copy `chain_slug`, `chain_name_he`, `external_id`, `title`, `source_title`, `image_url`, `canonical_url`, `price_agorot`, and nullable `category`. There is no `CatalogPort` in the tree. Re-harvest stays `tools/harvest_catalog.py`.

**Manual card is the only other exit.** Unknown host, no handle, timeout, non-200, non-JSON, or missing title or price: no HTML fetch. `AddManualItemRequest` already stores `canonical_url` and does not read it. Prefill the normalised URL. Title stays required. Price, image, and chain stay empty.

AI is absent. It would be required only to read HTML that had no Shopify product object and no JSON-LD or Open Graph. That fetch is out, so a model is never required. A model on a successful `.js` body can change agorot or the image. A keyword miss leaves `category` null.

Mechanism verdicts, for this pipeline:

1. Seed match only. Out. 45 curated rows, first variant, frozen 2026-08-28.
2. Live `.js` on the four hosts. This is v1.
3. JSON-LD and Open Graph. Out. Hebrew price strings are locale-ambiguous, and the fetch is HTML.
4. LLM extraction. Out. See above.
5. Bookmarklet, share target, extension. Out. Extension is barred; the others are an install step in mobile WhatsApp.
6. Manual card. In, as the failure sink, already on the manual-add contract.

## Non-goals

- An any-URL fetcher, HTML scraper, headless browser, or image-byte copy (P4; `image_url` is `varchar(500)`, seed URLs max 191).
- A shop widget, feed, webhook, or checkout (D11, D18, P2).
- Inserting paste hits into `catalog_items`, or refreshing a snapshotted price after add. The existing disclaimer says the live price is on the shop site.
- Persisting a variant id column. The variant lives in the buy URL. Two colourways are two rows; `external_id` is the product id and is not unique on `registry_items`.

## Top 5 risks

1. **Shared price converter.** Multiplying a `.js` integer by 100 stores ₪200 as ₪20,000, still under `MAX_PRICE_AGOROT` (10,000,000). A ₪4,490 stroller becomes 44,900,000 agorot and fails the cap. Cheap items save the wrong number; expensive ones error.
2. **Baby Star `.js` unproven.** The sampled seed handle 404'd. If the route is blocked, that chain is manual until another live handle is checked. The other three answered.
3. **Hotlink dependence.** Cards break if `cdn.shopify.com` paths change. Over 500 characters after normalisation means a null image on an otherwise good item.
4. **Variant-blind paste.** `price_varies` with no `variant` query. Taking `variants[0]` snapshots the wrong agorot, and the guest buys a different colourway.
5. **SSRF if the client URL is fetched.** The HTTP client may only see a URL the server built: `https`, pinned host, path `/products/{handle}.js`. A redirect off the allowlist, or a "try JSON-LD" branch, is an open proxy.

## Open questions for the human

1. `price_varies` is true and the URL has no `variant`?
   (a) Block save until the couple picks a variant from that payload.
   (b) Snapshot `variants[0]`, as harvest does.
   (c) Skip the resolver and open the manual card.
   Recommend (a). Labels and prices are already in the `.js` body.

2. Host is not one of the four?
   (a) Manual card, store the URL, no server fetch.
   (b) Fetch HTML and read JSON-LD / Open Graph.
   (c) Reject the paste. Manual items cannot carry a link.
   Recommend (a). The handoff can open a link we never parsed. (b) is the SSRF.

3. May the couple change the fetched price before save?
   (a) Yes. The preview shows the `.js` price; an edit is what we store.
   (b) No. Save always stores the second fetch.
   (c) Edits only after a failed fetch.
   Recommend (a). A bundle or a sale title can be wrong, and guests see the snapshot. A price with no successful preview is the manual card, not a resolved item.

4. CDN image missing, or still longer than 500 characters?
   (a) Save the resolved item with a null image.
   (b) Fail the whole resolve into the manual card.
   (c) Download the bytes and store them.
   Recommend (a). `image_url` is already nullable. (c) is new storage.
