# Add-by-link consolidation

One round. Seats did not reply to each other. Original discovery briefs in `docs/council/` were left untouched.

## Agreed

Two or more seats asked for each of these on their own.

- **v1 is a paste field, then one live Shopify product read, then a card the couple confirms.** Search of the harvested seed stays for browsing. It is not the paste resolver. The seed is ~45 curated products per chain.
- **The four chains are the tested set:** שילב, מוצצים, עגליס, בייבי סטאר. A product path (`/products/{handle}`, including a collection prefix) is the only path that resolves. Home, cart, collection, and Shilav's registry login page do not become a card.
- **A miss opens the manual form that already exists.** The URL is kept. The couple types the title and, when we have no price, the price. No image and no chain chip on that path.
- **The resolved fields are copied onto the registry item.** No catalog row, no foreign key. Chain, title, image, price in agorot, buy URL. Category may be suggested and may be empty. Two colourways are two items.
- **No Chrome extension, bookmarklet, share target, or retailer widget.** The list is built on a phone. The extension is already a PRD non-goal. The widget needs a partnership (D18, P2).
- **No AI, no HTML scrape, no Open Graph, no JSON-LD in v1.** The shop's product document already has title, image, variants, and price. A guessed shekel is public (D15) and becomes the group-gift target (D46).
- **No stock, no price refresh after save.** `המחיר מתעדכן באתר החנות` stays. Images stay hotlinked from `cdn.shopify.com`, or the existing placeholder.
- **The server builds the fetch URL.** Allowlisted host, `/products/{handle}.js`, timeout and size cap. The browser does not get to name an arbitrary URL. Tracking parameters are dropped. A numeric `variant` is kept.
- **Use Shopify `.js`, not `.json`.** Integrator measured `.js` variant prices as integers already in agorot on Shilav, Motsesim, and Agalis (2026-10-02). The harvest's `products.json` prices are decimal strings. One converter must not serve both.
- **Paste sits above the existing tabs, not in a third tab.** A WhatsApp blob yields the first URL in it. Nothing is saved until `להוסיף לרשימה`.

## Disputed

1. **Which hosts resolve.** Product wants any public Shopify product URL. Adversary and Integrator want only the four harvest hosts, and they refuse probing an unknown host for `products.json`. UX sends every unknown chain to manual with no preview.
2. **A product with several variants, and the URL names none.** Integrator blocks save until the couple picks from the payload. UX saves the parent product and tells the guest they will choose size or color on the shop site. Adversary shows title, image, and chain, leaves the price blank, and has the couple type it. Product rejects silently using the first variant.
3. **Who may change the shop's price.** Product locks it: the server copies the variant price, the couple may shorten the title only. Adversary, UX, and Integrator let the couple edit the price on the confirm card. Integrator also re-fetches on save so the browser cannot invent a price; an edit has to be an explicit override of that second read, or the re-fetch wipes it.
4. **Wrapped links.** Product follows one redirect (Instagram, campaign, short links), then applies the Shopify rule. Adversary and Integrator accept a redirect only when the couple already pasted a product URL on an allowlisted host and the hop stays on that host. They refuse shorteners and `shop.app`.

## Dropped

- **Match the paste against the seed.** Most real URLs are not in the snapshot, and a hit can still be the wrong colour at a harvested price.
- **AI extraction, including "title and image only, couple types the price."** It requires fetching arbitrary HTML, which is the open proxy this round is refusing. The manual form already collects those two fields.
- **Adversary's `/products/{handle}.json`.** Price unit was not measured. `.js` was, and it matches the seed's agorot.
- **Client-side fetch.** The shop will not send CORS headers for our origin. The usual workaround is the extension.
- **Re-hosting images, writing paste hits into `catalog_items`, a price-refresh job, affiliate parameters, and a guest-facing dead-link badge.**
- **Baby Star is not a reason to change the pipeline.** One sampled `.js` handle returned 404. The other three succeeded. Verify another Baby Star handle during implementation; until then that chain fails into manual like any other miss.

## Resolved with the human

1. **Four chains only.** שילב, מוצצים, עגליס, בייבי סטאר. A fifth Shopify host later is an allowlist row. Recorded as D59.
2. **Variant picker** when the URL names none and the price varies. Recorded as D60.
3. **The couple does not edit a resolved card.** Shop price, shortened title, and keyword category are stored as read. The human asked for the least possible work, including no price editing. Recorded as D61.
4. **Direct product URLs only.** No unwrapping of Instagram, campaign, or short links. Recorded as D59.

## For the human

Ranked by how much the answer changes the design.

1. Host scope: four chains, any Shopify, or four plus a hand-maintained allowlist.
2. Missing variant: picker, parent URL for the guest to finish, or blank price.
3. Price on a successful read: locked to the shop, or editable before save.
4. Wrapped and shortened links: one hop, or direct product URLs only.
