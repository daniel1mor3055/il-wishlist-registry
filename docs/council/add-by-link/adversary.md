# Adversary brief

## Goals

One v1 approach: an allowlisted read of a single Shopify product on שילב, מוצצים, עגליס, or בייבי סטאר, then a card the couple confirms. That is the paste resolver D22 already names, and nothing wider.

A pasted URL from those four should fill title, image, chain, price, and a buy link, and those fields snapshot onto the registry item. A miss is the manual form this product already has: the URL is kept, the couple types the title and the price, the guest still leaves for the shop.

Paste is a prefill. Search of the harvested seed and the manual form are what still build a list the morning those shops stop serving public JSON.

## Must-haves for v1 design

- The field takes an `https` URL whose host is one of the four harvest hosts or that host's www/apex twin, spelling included (`agalease-baby.co.il`). The path is `/products/{handle}`, with an optional locale or `/collections/{collection}` prefix. Keep a numeric `variant`. Drop every other query parameter.
- One explicit submit fetches `https://{that host}/products/{handle}.json` once. Timeout, size cap, redirects only to a host already on the list. One product. Paging `products.json` is a different job, and so is the seed.
- A `variant` that exists in the payload selects that variant's price and image. A product with one variant selects it. Several variants and no id: show title, image, and chain, and leave the price blank.
- The couple sees that card, can edit the price, and taps add. Category is their chip. The harvest keyword map may suggest one; it must never drop the product. Blank price still saves. Group gifting stays off until they set a price (D46).
- Save copies title, image, chain, price, and a canonical buy link onto the registry item. No catalog row and no foreign key, which is already how items work. Today's manual save drops image and chain; a resolved paste has to write both or the guest card is a typed title with a naked link.
- Unknown host, non-product path, timeout, non-200, missing title, or a price that is not ILS: the same card, URL kept, other fields empty.
- Images stay on `cdn.shopify.com` (already allowed) or the existing placeholder. The guest line `המחיר מתעדכן באתר החנות` stays for drift after the snapshot (D26). It is not a license to store a bad number.

## Non-goals

Cut these even if another seat loves them.

- A universal "any URL" product. Every shop outside the four is the manual card. That includes Zap, Super-Pharm, Amazon, IKEA, and a lookalike domain.
- Matching the paste to the ~180 seed rows, including as a fallback. The harvest keeps about 45 products a chain, keyword-gated, first variant, title split on ` / `. Most real URLs miss. A hit can still be the wrong color at a harvested price.
- HTML scraping, Open Graph, JSON-LD, microdata, and a headless browser. A bot-wall page parsed into a card is a fake product.
- Any model. A generated shekel is the D26 trust failure, and it is public (D15) and the group-gift target (D46). These four endpoints do not need AI. The human's offer to put a model in the loop is declined.
- Chrome extension, bookmarklet, iOS shortcut, share target, retailer widget. The extension is already a PRD non-goal. The widget assumes a partnership D18 and P2 refuse. The install is the blocker they already named.
- Treating "runs Shopify today" as a way to onboard shop five, and probing an arbitrary host for `products.json` to check.
- Fetching arbitrary URLs, unwrapping shorteners, and accepting `shop.app` links. That is SSRF into the compose network (D21), with a parser behind an open redirect. D23 defers hardening and forbids making the later pass harder.
- Reusing the harvest `normalise()`. It rejects uncategorized products, keeps `variants[0]`, chops titles, strips marketing prefixes the couple may have meant (`הזמנה מוקדמת`), and reads a decimal shekel. A sibling Shopify endpoint speaks subunits. The wrong parser is a 100× public price.
- An in-app variant picker, a price-refresh job, stock, affiliate or campaign parameters on the buy link, and writing the paste into the shared catalog.
- New image hosts. A hotlink miss uses the placeholder. A wider image-optimizer allowlist is a second SSRF hole.
- A third tab that promises magic. One paste field in front of the card they confirm. Client-side fetch is cut with it: the shop will not set CORS for us, and the usual fix is the extension.

## Top 5 risks

1. **The stored price is the gift.** Guests see it (D15). Group gifting copies it into the target (D46). Nothing refreshes it (D26). The disclaimer covers the shop changing the price later. First variant, a `מ־` price, a unit mix-up, and a model all store the wrong number on the way in.

2. **D22 is risky if the port name gets read as a platform.** Four shops served unauthenticated `products.json` when someone checked. That is not a contract, a rate limit, or a fact about the next chain. The reading that stays inside D22 is one allowlisted fetch that fails into the manual card. Built as "the catalog strategy," paste is the feature that breaks when a theme starts returning 403, and the list builder goes with it.

3. **A seed match looks sure and is usually wrong.** Collection paths, `variant`, `utm`, a product the curator skipped, a product added after the snapshot: ordinary pastes. Shipping lookup-against-180 as v1 fails on the stroller they actually opened. The URL column already stores unparsed text. A confident miss is a worse form than that column.

4. **Our server is the client that gets blocked.** The couple's phone just loaded the page. The fetch comes from a datacenter IP. The harvest script's browser User-Agent is how a wall becomes permanent. One plain request per tap. A blocked response is an empty card, not a retry loop and not a second extractor.

5. **The guest handoff preserves the wrong product.** Dropping `variant` lands them on another color. Keeping a campaign URL lands them on a dead promo. Hotlinking a non-Shopify CDN 404s the photo. Store `/products/{handle}` plus the variant id when we resolved one. Store an image only when the host is `cdn.shopify.com`.

## Open questions for the human

1. **Several variants, and the URL names none. What is on the card?**
   (a) The first variant's price, as the harvest stores it.
   (b) Title, image, and chain; the price stays blank and the couple types it.
   (c) A variant picker from the JSON.
   (d) The lowest price, labeled `מ־`.
   Recommendation: (b). The shop tab is still open. (c) is a product page we do not own. (a) and (d) publish a number a guest can fund.

2. **What does the field promise, in the Hebrew placeholder?**
   (a) Any product link.
   (b) The four chains by name. Any other host skips the fetch and opens the empty card with the link kept.
   (c) The four chains, then a quiet Open Graph pass on everything else.
   Recommendation: (b). The first link from a shop we do not fetch would otherwise define paste as broken.

3. **A single-variant parse is clean. How does it get onto the list?**
   (a) Add on success, no preview.
   (b) One confirm, price locked.
   (c) The card, price editable, then add. Category stays optional.
   Recommendation: (c). The snapshot is the guest-facing price, and the shop will not rewrite it for us. That look is the only check in the product (D11).

4. **The fetch fails, or the host is not one of the four. What fills the card?**
   (a) A model reads the page and fills title, image, and price.
   (b) A model fills title and image; the couple types the price.
   (c) No model. The link stays. They type title and price.
   Recommendation: (c). (a) invents a shekel. (b) still fetches arbitrary pages, to skip two fields the manual form already has.
