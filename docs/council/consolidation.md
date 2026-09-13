# Council consolidation

One round, four seats: [product](product.md), [adversary](adversary.md), [ux](ux.md), [integrator](integrator.md). This file merges them. Where seats conflict, the conflict is named rather than averaged away.

## Agreed (two or more seats, independently)

| # | Agreement | Seats |
|---|---|---|
| A1 | The public guest page on mobile is the product. It is the only screen most people ever see, the only place money is decided, and the screenshot that sells the company. | Product, UX, Adversary |
| A2 | Trust is a design element, not a footer. People-first above the fold (couple photo and names before our logo), plus an explicit reassurance strip: no signup, no card details, no account. | Product, Adversary, UX |
| A3 | The WhatsApp share artifact is a designed surface. The link-preview card is the highest-traffic "screen" in the product and legitimacy is judged from it alone. | Product, Adversary, UX |
| A4 | Reservation state is public, giver identity is private to the couple, and there are no countdown timers on a family gift page. | Product, Adversary, UX |
| A5 | Money is a tile in the same grid as products, not a separate tab. Israeli guests want to give money and a secondary surface loses them. | Product, UX |
| A6 | Starter templates are the cold-start engine. The couple never sees "add your first item"; they edit down a pre-filled list. Subtraction is the primary verb. | Product, Adversary, Integrator |
| A7 | Add-from-URL is the honest basis for the "universal, cross-chain" claim, and it needs zero retailer cooperation. Single-chain incumbents structurally cannot match it. | Product, Adversary, Integrator |
| A8 | Guest data minimum: optional first name, optional blessing, nothing else. Ask for the name as `למי להגיד תודה?` (who should we thank) rather than as tracking. | Adversary, UX, Product |
| A9 | On group gifts the remaining amount is the headline, not the percentage. | UX, Adversary |
| A10 | Mock the provider, never the contract. Every mock carries the real field set and its failure states, and the UI must never imply we verified a purchase or hold a live price. | Integrator, Product |
| A11 | Lifecycle matters: a registry is born around week 28, peaks at the ברית, and dies. A stale registry full of taken items is a trust event for the late guest. | Product, UX, Adversary |
| A12 | RTL is a first-class risk. Mirrored-but-wrong output is worse than obviously broken, because it gets approved and baked in. | UX, Product |
| A13 | Empty and near-empty states must be as designed as the full state; the widget and early sharing guarantee they will be seen. | UX, Product |
| A14 | Double-buy prevention rests on guest self-declaration, because purchase detection is impossible without a retailer webhook. The UI must be trustworthy without overclaiming. | Integrator, UX |

## Disputed

Each is a real fork, not a wording difference.

| # | Dispute | Positions |
|---|---|---|
| X1 | **Who touches the money** | Adversary: nobody ever, Bit/Paybox handoff plus a `שילמתי בביט` ledger entry, which kills custody, float, licensing and partial-fund unwinding in one move. Product: mocked rail that visually invokes something Israelis already trust, else money items are abandoned. Integrator: settlement is a spectrum (S1 pledges, S2 escrow, S4 auth-and-capture); convert-to-shop-credit is rejected because we do not sell cards. UX: designed a plain mock checkout with a demo strip. |
| X2 | **Retailer embed widget depth** | Adversary: cut it, it is a partnership artifact drawn before any partnership conversation. Product: keep it, but as one sales-artifact screen. UX: designed four frames including the no-registry acquisition loop. Integrator: it is tier 1 of an adoption ladder and the no-registry fallback is the acquisition loop that makes it worth a chain's while. |
| X3 | **Shekel amounts on the public page** | Product: hide them, show social progress (`עוד 2 משתתפים`), because family gift-value comparison is a real social hazard. UX and Adversary: show amounts explicitly, because a vague ask converts worse and the remaining amount is the motivator. |
| X4 | **When the registry opens for giving** | Adversary: a meaningful share of Israeli families will not bring baby equipment home before the birth, so build pre-birth, publish at the announcement, and default to ships-after-birth. This turns the superstition into a feature. Product and UX: pre-birth countdown with a born-flip later, i.e. the Babylist shape. Only the Adversary raised this. |
| X5 | **Reservation lifecycle** | UX: needs an answer between never-expires, auto-release with a nudge, or two-step confirm. Adversary: never expires, no timers. Integrator: unverifiable either way, so the couple needs a correct-or-undo control. |
| X6 | **Blessings** | UX: opt-in public blessings wall as its own page. Adversary: cut it, the blessing is a field on the gift and a second surface doubles the empty-state problem. |
| X7 | **Paste-a-URL fidelity in the POC** | Integrator found all four chains run Shopify and currently expose public product JSON, so genuinely live cards are cheap. That stretches D4's "mocked catalogs". Adversary would keep it fully mocked to avoid training the team on access that can be revoked. |
| X8 | **Thank-you channel** | Product: ask for an optional phone with an explicit reason. Adversary: no phone, ever; give the couple copy-ready text they paste themselves. |
| X9 | **Brand on the guest page** | Product: neutral cross-chain with per-item chain marks. Alternatives are white-label per retailer, or our brand with chains in fine print. Integrator notes cross-chain neutrality is the one thing no chain can offer, and is why the couple shares the link. |

## Dropped

Rejected outright, with the reason.

- Own storefront, warehouse, checkout, shipping. Babylist's margin engine and its hardest asset; we route outbound and borrow the chain's trust.
- Browser extension. Paste-a-link covers the job; extensions die on mobile and Israeli gift shopping is mobile.
- Baby shower invitations and event pages. Israel does not run showers at scale; the ברית and the first home visit are organized in WhatsApp already.
- Insurance-funded breast pump flow. A pure artifact of US insurance; קופות חולים work nothing like it.
- Editorial hub, week-by-week pregnancy, name tools, reviews. SEO plays needing staff and data we lack; they dilute a registry demo into a portal.
- Completion discount, gift receipts, returns, exchanges. Require signed retailer terms, or belong to the chain that owns the transaction.
- Guest accounts, guest history, guest-to-guest visibility. Every account we ask of a guest is conversion handed back to the envelope.
- Retailer admin console, merchant dashboard, analytics.
- Public discoverability, SEO, registry search directory. Here discoverability is a liability; lists stay unlisted with a long random slug and noindex.
- Escrow with refunds as the POC default. Highest regulatory load, and a float held for weeks against an uncertain birth date is the worst possible starting shape.

## Cross-cutting warnings worth keeping

- **Cannibalization.** If the digital envelope is the easiest tile, most guests take it, retailers see no attributed orders, and the B2B2C thesis loses its evidence. Tile hierarchy must make the product tile nicer than the money tile. (Product, flagged against locked D5.)
- **The link reads as phishing.** An unfamiliar Hebrew domain in a group message, mentioning money, to an audience trained on delivery-SMS fraud. This can cap conversion regardless of visual quality. (Adversary.)
- **Load-bearing decoration.** We do not sell gift cards. Nobody shares a link to a cash page. The catalog earns the share; Bit/Paybox is the fallback. Say it plainly rather than pretending catalog breadth is the roadmap. (Adversary.)
- **Privacy asymmetry.** Names of pregnant women, due dates, guest names and amounts, under a privacy regime that raised penalties in 2025. Collect almost nothing. (Adversary.)

## Resolution

Answers from the human are folded into [../decisions.md](../decisions.md) as D11 and onward, and drive [../prd.md](../prd.md) and the Figma Make prompt pack.
