# Product brief

## Goals

The couple builds the list on a phone, late, hopping between a chain's mobile site, Instagram, and a WhatsApp thread where a friend already sent a link. The job is to turn that link into a gift card without installing anything and without retyping the product. Success is a preview they recognise — photo, short Hebrew name, shekel price, shop name — then one tap, then the next link. Search of the harvested seed (~45 products per chain) is for browsing when they have no URL. It is not how they shop.

The guest's job stays the one in the PRD: land from WhatsApp, read the card in a few seconds, leave for the chain, pay the chain, self-report (D11, D12). A pasted item has to be the same card as a catalog item. A title plus a naked URL is not a gift a family group trusts, and it does not say which shop will open.

The retailer, with no partnership and no widget (D18, P2), gets a guest who arrives on the right product page ready to pay them. The card names the shop and links to that page. We still never take payment, never show stock, and never look like the shop.

Ways from a pasted URL to a card: (1) a live Shopify product read of that URL, (2) match the URL to the harvested seed, (3) scrape the HTML or call a third-party unfurl, (4) an LLM reads the page, (5) an extension or share target reads the shop's page, (6) a retailer widget. v1 is (1). When the read does not apply, the couple finishes on the manual tab that already exists. (2)–(6) are rejected in Non-goals.

v1 feels like the reference product here when a link from שילב, עגליס, מוצצים, בייבי סטאר, or any other public Shopify shop becomes that card on the first paste. Super-Pharm, KSP, IKEA, Amazon, Zap, and an Instagram post stay manual. A promise of "any link" that fails on the stroller they care about is a worse product than a narrow promise that holds.

## Must-haves for v1 design

D22 already names a live Shopify read as the paste resolver. It is not built. Today search hits the seed, and `AddManualItemRequest` stores `canonical_url` without fetching it.

Paste is the default add surface. Search and manual stay. The field accepts a whole WhatsApp message and takes the one https URL out of it. iOS will not yield the clipboard on its own, so the control is an explicit paste, sized for a thumb. One redirect is followed (Instagram and campaign links wrap the shop). The read is that product alone: title, image, variant price, shop. Those fields are copied onto the registry item. No foreign key. No stock (D26). The guest card keeps `המחיר מתעדכן באתר החנות`.

This is not the harvest. The seed drops uncategorised products, prices outside a band, and every variant but the first. A pasted URL skips those filters. The colour in the URL is the gift; two colours are two items. The price is that variant's selling price, in agorot, copied by the server. The couple may shorten the display title — shop titles pack the colourway and will not fit the card — and may set a category when the keyword map misses. They do not type or override the price. A missing price does not become ₪0; that URL falls through to manual. The stored link is the product page the guest opens, variant kept, tracking parameters dropped.

Preview before save, as a card: image, title, price, the Hebrew name we already use for the four chains, the shop's own name for any other Shopify host, and the outbound link. Then `להוסיף לרשימה`.

Anything else — a collection, a cart, Shilav's login-gated registry page, a non-Shopify shop — does not become a guessed card. The manual form opens with the URL filled in and one sentence that this shop did not return a product card. Title and price stay the couple's to type. Manual items have no photo today; the guest placeholder is enough for that path in v1.

The read runs only for a signed-in couple, only for the one product URL they submitted, only to fill their own item. It must not become a general "fetch this page" tool, or D23's later hardening inherits an open proxy.

## Non-goals

- A browser extension, bookmarklet, or home-screen share target. The list is built on a phone, the link usually arrives in WhatsApp, and an install is the blocker this round is here to avoid. Already a PRD non-goal.
- AI or vision on a page or a screenshot. Shopify's public product JSON already carries title, image, variants, and price. A model that guesses a shekel amount is the wrong-price failure D26 exists for. Not required for v1.
- HTML or Open Graph scraping, and third-party unfurl APIs. Weaker than the product JSON on the chains that matter, and the couple's URL would leave our server.
- Matching the paste against the harvested seed, or calling a full re-harvest the paste feature. ~45 items per chain will miss the URL in their clipboard. A complete snapshot of the four chains still misses tomorrow's product and every shop we do not list.
- Retailer APIs, affiliate tags, the embed widget, any contract (D18, P2). The couple is already on the product, or holding a link a friend sent. A button inside the shop waits on a partnership.
- Live price or stock after save, price-drop alerts, and re-hosting the shop's images.
- Treating an Instagram, Facebook, or WhatsApp destination that never lands on a product as resolvable.

## Top 5 risks

1. **The item they care about is not on Shopify.** A custom-site stroller, a KSP monitor, an IKEA crib, a seller in Instagram. v1 gives those a photo-less manual card. If the paste field sounds like every Israeli shop, the first miss feels like a broken app.
2. **The public JSON read fails from a server.** The harvest works today as a script with a browser user-agent. A hosted resolver can be blocked or switched off, and then every paste fails at once. D22 is the right call and still brittle. v1 does not add a second source to cover that.
3. **Wrong variant, wrong shekels.** The first variant's price, written onto a later group-gift target (D46), is the wrong gift. A confident wrong card is worse than manual entry.
4. **A non-product URL becomes a product.** Collection pages, the Shilav registry login, a campaign homepage. Saving "something" from that page publishes the wrong gift at the birth.
5. **The link dies before the guests arrive.** Lists start around week 28 and are used after the announcement (D14). Handles and CDN images change. We snapshot both and will not pretend to know availability (D26). The guest then opens a dead chain page, and the self-report cannot repair the gift.

## Open questions for the human

1. **Which shops does a successful paste cover?**
   (a) Only שילב, עגליס, מוצצים, and בייבי סטאר.
   (b) Any public Shopify product URL. Those four are the tested set; any other host is accepted when the product read succeeds.
   (c) The four now, plus a hand-maintained allowlist when someone reports a miss.
   Recommendation: (b). A lot of smaller Israeli baby shops are Shopify, and an allowlist turns each boutique into a ticket. (b) still leaves non-Shopify on the manual path.

2. **What should a failed paste do?**
   (a) Manual add, URL kept, couple types title and price, no image, plus one sentence that this shop did not return a product card.
   (b) Prefill title and image from Open Graph and ask only for the price.
   (c) Run an AI extraction and ask the couple to confirm title, image, and price.
   Recommendation: (a). (b) and (c) are the second system rejected above, and a prefilled wrong title will get saved. The sentence has to state the limit so a Super-Pharm link does not look like a bug.

3. **Who owns the price and the variant on a successful read?**
   (a) The server copies the URL's variant price. The couple may edit the short title only. No price override.
   (b) The server proposes the price and the couple may change it before save.
   (c) Ignore the variant and use the product's first variant, as the harvest does.
   Recommendation: (a). Catalog adds already refuse a client-supplied price. An override becomes the group-gift target (D46). (c) is the wrong colour of a stroller they already chose.

4. **How far do we follow a wrapped link?**
   (a) One redirect, then the same Shopify rule. Otherwise manual.
   (b) Only a direct product URL on a known host. Shortened, wrapped, and campaign links fail.
   (c) Follow redirects, and if the final page is not Shopify, fall through to Open Graph or AI.
   Recommendation: (a). Friends and Instagram send wrappers; refusing them rejects the real paste. Walking hops until a page looks like a product is the scraper we are not building.
