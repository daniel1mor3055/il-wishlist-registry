# Integrator brief

## Goals

1. Replace "easy for shops to integrate" with an **adoption ladder** where every rung delivers value alone, so no chain has to do work before we have proven anything.
2. Ship a POC whose mocks have the **same field set and same failure modes** as the real integrations, so nothing gets redesigned when a contract lands.
3. Keep money-custody questions separable from product questions. The funds UX must survive us never holding money.
4. Name the sellable asset before asking a chain for anything.

**Adoption ladder.** Never require tier n+1 to deliver tier n value. This is the whole definition of easy.

| Tier | Retailer effort | What we get | Available |
|---|---|---|---|
| 0 | None | URL paste, outbound link, cross-chain list | Today, all four chains |
| 1 | One script tag on the PDP | "Add to registry" button, capture at intent | Needs a theme edit |
| 2 | One order webhook or pixel | Purchase confirmation, attribution, rev-share | Needs a contract |
| 3 | Product feed | Live stock/price | Needs an integration project |

**Grounded finding that changes the plan.** All four target chains run Shopify (verified via storefront fingerprints), and all four currently expose the public unauthenticated product JSON endpoints (`/products.json`, `/products/<handle>.js`). A live check on Baby Star returned title, vendor, price in agorot, availability, and images: exactly a registry card, from a documented platform contract rather than HTML scraping. Product pages also carry Open Graph and JSON-LD `Product` as a generic fallback. Tier 0 is therefore much stronger than assumed, and Shopify is the only platform the embed must target for v1.

## Must-haves for v1 design

### Item ingestion

| Option | Our effort | Fragility | Legal exposure | Card quality |
|---|---|---|---|---|
| Paste URL, server-side extraction | Medium | Low for the 4 chains (platform JSON), medium for long tail (OG/JSON-LD) | Low-medium: user-initiated single fetch, not bulk crawl. Image caching and chain naming need care | High |
| Browser extension | High (build, store review, per-browser, mobile gap) | Medium | Low | High |
| Manual entry with a photo | Low | None | None | Poor, and the couple abandons |
| Pre-seeded curated catalog per chain | Medium ongoing (staleness is a treadmill) | High over time | Low-medium | High but goes wrong quietly |
| Retailer feed / API | Low for us, high for them | Low | None | Highest |

**Recommendation.** POC: pre-seeded curated catalog per chain, as D4 locks, but emitted through the *same resolver interface* the real extractor will use, with manual entry as the always-present fallback. Real product: paste-a-URL with a three-step resolver, Shopify product JSON, then JSON-LD/Open Graph, then manual-edit card. No extension in v1; it is a conversion accelerator, not a capability.

Ingestion guardrails, all three design-visible: store the canonical URL plus external product and variant id as the dedupe key (titles change, ids do not); cache our own thumbnail with a takedown path rather than hotlinking; never present a cached price as authoritative. Copy: "המחיר מתעדכן באתר החנות" (The price is updated on the shop's site).

### Embed widget contract

Smallest surface a Shopify web team will agree to: one script tag plus one container element in the product template, no retailer server work, no webhook, no PII sent to us. Everything else happens in our hosted overlay so the retailer never touches our session or our cookies.

| Field passed | Required | Where it comes from on a Shopify PDP | Why we need it |
|---|---|---|---|
| Retailer id | Yes | Issued by us | Attribution, rev-share |
| Canonical product URL | Yes | Canonical link | Dedupe key, outbound fallback |
| External product id + variant id | Yes | Product and variant ids | Stable identity |
| Title | Yes | Product title | Card label |
| Image URL | Yes | Featured image | Card visual |
| Price + currency | Yes | Variant price | Funding goal, group-gift math |
| Availability | No | Variant availability | Out-of-stock state |
| Vendor, product type | No | Vendor, type | Grouping, duplicate detection |

What we render: one button, "הוסף לרשימת הלידה" (Add to the birth registry), which opens our overlay for registry selection and quantity or note. Post-add state: "נוסף לרשימה" (Added to the list).

Fallback when the shopper has no registry, and the reason a chain benefits at all: never dead-end. The overlay offers "פתחו רשימת לידה" (Open a birth registry) with the item pre-attached, and a lower-commitment "שמרו לי את הפריט" (Save the item for me) that stores it in an anonymous draft claimable later. That draft is the acquisition loop; without it the widget is a favour we are asking for.

Also reserve contract room, design only, for the reverse direction: a shopper arriving from a registry link sees "קונים עבור: אור ותומר" (Buying for: Or and Tomer) on the retailer's page.

**Be honest about the gap.** With no tier-2 webhook we cannot detect a purchase. Double-buy prevention (D8, LOCKED) therefore rests on guest self-declaration, with the couple able to correct it in the tracker. The UX must make reservation state trustworthy without claiming we verified anything.

### Cash, not cards

We do not sell chain cards or hold money. Cash is one Bit/Paybox envelope (`kind=fund`). The guest copies the couple's number and sends; we record the self-report. Shop cards and BuyMe-shaped SKUs were considered as a money model and rejected: they would make us a reseller or a money holder.

| Instrument | Guest does | Couple receives | Scope | Main constraint |
|---|---|---|---|---|
| Cash (`שי`) | Sends via Bit or Paybox to the couple's number | Money in their own app | Anywhere | We never touch it (D11) |

### Group gifting settlement

Options, not an assumption. A deadline is mandatory in all of them; an open-ended fund is the failure mode.

| # | Who holds contributions | Goal never met | Couple ends up with | Regulatory load |
|---|---|---|---|---|
| S1 | Nobody. We track pledges only | Nothing to unwind | Coordination; guests pay later | None; weakest UX, high leakage |
| S2 | Us or a PSP holding account | Refund every contributor | The item, or a payout | Highest |
| S3 | Us, then the chain | Auto-converts the partial sum to shop credit | Rejected | Medium; no refund ops |
| S4 | PSP holds an authorization, captured on goal | Authorizations expire uncharged | The item | Low, but auth windows are far shorter than registry timelines |
| S5 | The chain hosts the fund | The chain's policy | Chain credit | Lowest for us; needs cooperation and kills the cross-chain promise |

Design default: S1. Nobody holds contributions. Guests send via Bit/Paybox; we ledger the self-report. S3 (convert the miss to shop credit) is rejected: we do not sell cards. The couple needs a visible contribution ledger.

### What stays mocked, and how to mock it honestly

Rule: mock the **provider**, never the **contract**. Every mock returns the real field set, including its failure states.

| Thing | Mocked as | Honesty guardrail |
|---|---|---|
| Chain catalogs | 40-60 curated items per chain, real Hebrew title style and real price bands | Same shape as extractor output; must include out-of-stock and price-changed items |
| URL paste | Resolver recognises the four chains' URL patterns, returns from the seed set | The "we could not read this page" state must appear in the demo |
| Payments | Bit/Paybox handoff, no PSP | Unset-handle and copy-failed states must be designed too |
| Purchase confirmation | Guest self-declaration only | Never imply we detected a purchase |
| Embed widget | Designed, not shipped; demoed on an obviously-ours fake PDP | Do not clone a chain's storefront |

Anti-corner-painting rule: if a real integration could not supply a field, the mock must not supply it either. Feed the demo real-time stock or a buyer email and the design will silently assume both forever. Use neutral chain-name chips, not chain logos.

### Sellability

Traffic is unprovable at zero scale, basket-size lift is unprovable pre-launch, chains will not pay for data, and white-label is a downgrade pitch to Shilav, who already built one.

The real pitch is **incremental, attributed, non-cannibalising demand**: a registry guest is a third party buying a specific SKU that someone else chose, whom the chain has no relationship with today. Sell attributed referral orders on CPA or revenue share, with the retailer's total cost being one script tag. The wedge is that we are cross-chain, the one thing no chain can offer its own customers, and the cross-chain list is exactly why the couple shares the link. We do not sell gift cards and we do not pitch ourselves as a card reseller.

## Non-goals

- No retailer contracts, feeds, real APIs, or Shopify App Store listing in this phase.
- No PSP selection, custody model, licensing posture, invoicing, or tax design.
- No browser extension, no native share-sheet target.
- No live price or stock sync, no price-drop alerts, no back-in-stock notifications.
- No automatic purchase detection, no affiliate-network plumbing.
- No retailer-facing admin or analytics console.
- No English UI (D6), no microservice, schema, or infrastructure design (D10).

## Top 5 risks

1. **Purchase confirmation gap.** D8 is LOCKED but unverifiable at tier 0 or 1: reservation is not purchase. If the couple gets duplicates anyway, the core promise breaks and no amount of UX polish recovers it.
2. **Money custody.** Cash funds and group gifting make us a money holder under Israeli payment-services rules if we ever take custody. Designing only S2 and later failing to get a licence means rebuilding the entire funds experience; S1 (Bit/Paybox, nobody holds) is the live model.
3. **Platform dependency.** Our cheap tier-0 ingestion rests on Shopify public JSON endpoints that any store can disable and that are rate-limited. A chain that dislikes us can switch it off unilaterally, and the OG/JSON-LD fallback yields visibly worse cards.
4. **Retailer indifference.** Shilav already has a login-gated registry, so we are asking a chain to help a competitor-neutral aggregator. Without measured attributed revenue, the tier-1 script tag never reaches a sprint, and tiers 2-3 never happen.
5. **Legal and brand exposure.** Caching images and naming chains implies partnership; stale prices or stock generate consumer complaints aimed at the chain, which is precisely the argument they will use to refuse the embed.

## Open questions for the human

1. **How real should paste-a-URL be in the POC?** (a) Fully mocked: URL matched against the seed catalog only. (b) Seed catalog plus live reads of the four chains' public Shopify product JSON, giving genuine cards with no HTML scraping. (c) Generic live Open Graph / JSON-LD extraction for any URL. Note that (b) and (c) push past "mocked shop catalogs" in D4.
2. **Which settlement model do we design as the default?** (a) S1, pledges only, no money touched — live. (b) Rejected: S3, contributions convert to a shop card if the goal is missed. (c) S2, escrow with refunds. (d) Keep every screen switchable to S1.
3. **Do we sell shop cards in v1?** No. We do not sell gift cards. Cash is Bit/Paybox only.
4. **Which purchase-confirmation model do the screens assume?** (a) Guest self-declaration only. (b) Self-declaration plus couple confirm-or-undo in the tracker. (c) Design for a retailer webhook now and stub it, accepting that tier 2 may never arrive.
