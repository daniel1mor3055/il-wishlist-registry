# Decision log

Living record of what is locked, what is parked, and why. Update this file when a decision changes; do not silently contradict it in other docs.

Status values: `LOCKED` (design and POC assume it), `PARKED` (deliberately deferred), `OPEN` (blocks something, needs an answer).

## Locked

| # | Decision | Detail | Status |
|---|---|---|---|
| D1 | Reference product | [Babylist](https://www.babylist.com/) is the UX north star: one public list page, guest buys without an account, gift tracker for the couple, group gifting, cash and gift-card funds, one shareable link. | LOCKED |
| D2 | Wedge | Baby registry ("רשימת לידה") only. Wedding, birthday, and generic wishlists are out of this phase even though the platform should not architecturally forbid them. | LOCKED |
| D3 | Design surfaces | Three surfaces get designed: (1) public guest registry page, (2) couple editor, (3) retailer embed widget. | LOCKED |
| D4 | POC scope | POC implements only surfaces 1 and 2, with mocked shop catalogs and mocked gift cards. No real retailer APIs, no real payments, no cloud. | LOCKED |
| D5 | Gifting model | Hybrid, like Babylist: product items (outbound or mocked checkout) + couple-chosen gift cards and cash funds + optional group gifting on expensive items. | LOCKED |
| D6 | Language | Hebrew only, RTL. No English UI in this phase. Internal docs stay in English; all user-facing copy is Hebrew. | LOCKED |
| D7 | Guest identity | No guest account. Optional name and blessing. The couple sees who gave what (Babylist Gift Tracker default, not surprise-by-default). | LOCKED |
| D8 | Double-buy prevention | Other guests must see that an item is already taken or partially funded. Reservation state is public, giver identity is not. | LOCKED |
| D9 | Visual tooling | Figma Make prompting only. No Figma plugin, no Figma MCP, no hand-built component library. Deliverable is a paste-ready prompt pack. | LOCKED |
| D10 | Phase output | This phase produces docs only: decision log, PRD-lite and UX spec, council notes, Figma Make prompt pack. No application code. | LOCKED |

## Locked, round two (post-council)

Resolved from [council/consolidation.md](council/consolidation.md). These supersede any council brief that contradicts them.

| # | Decision | Detail | Status |
|---|---|---|---|
| D11 | No money custody, ever | We never hold, route, escrow, or disburse funds, and there is no checkout anywhere in our product. This removes licensing, float, refunds, and partial-fund unwinding as problems. Every gift action is an outbound handoff followed by a return self-report. | LOCKED |
| D12 | Self-reported purchase confirmation | Babylist-style modal on return: "האם רכשת את הפריט?" with yes and no. Yes updates the registry so other guests do not duplicate-buy. The record is self-reported by the guest, never derived from a transaction we processed. | LOCKED |
| D13 | Inline contact reveal | For cash gifts, the guest sees the couple's phone or payment handle inline with a copy button ("צריכים את הפרטים של נועה ואיתי?") and sends money directly via Bit or PayBox. We display, we do not process. | LOCKED |
| D14 | Publish window | The list is built pre-birth and published at the birth announcement. "נשלח אחרי הלידה" is the default item framing. This converts the common reluctance to bring baby equipment home before the birth into a feature rather than a blocker. | LOCKED |
| D15 | Amount visibility | Item prices and group-gift remaining amounts are public. Per-guest contribution amounts are never public; they appear only in the couple's tracker. | LOCKED |
| D16 | Reservation lifecycle | Two-step: reserve, then confirm via D12. No visible countdown to the guest. The couple can release or correct any item in the tracker. | LOCKED |
| D17 | Blessings are private | A blessing is a message to the couple only. No public blessings wall, no public guestbook. | LOCKED |
| D18 | Retailer widget is a prototype only | Designed as UI and UX frames with no partnership assumed. No attribution panel, no retailer co-branding, no revenue-share narrative, no POC path. | LOCKED |

Consequence worth stating plainly: because of D11 and D12, the product is a **coordination layer**, not a commerce layer. Our screens never take a card. Trust design therefore shifts from "this checkout is secure" to "this page is really from Noa and Itai, and we are not asking you for money."

## Target retailers

Design content should look like these chains. None of them is integrated in this phase; all catalog data is mock.

| Chain | Site | What they have today |
|---|---|---|
| Shilav / שילב | [shilav.co.il](https://www.shilav.co.il/pages/baby-registry) | A baby-registry page behind login, plus a store gift card. Closest thing to a registry in the market. |
| Motsetsim / מוצצים | [motsesim.co.il](https://motsesim.co.il/) | Smart checklist and printable birth list, not a shareable registry. |
| Agalis / עגליס | [agalease-baby.co.il](https://www.agalease-baby.co.il/) | Birth packages and in-branch consultation, no registry. |
| Baby Star / בייבי סטאר | [baby-star.co.il](https://www.baby-star.co.il/) | Birth packages, no registry. |
| BuyMe | [buyme.co.il](https://buyme.co.il/) | Already sells baby gift cards and boxes. Candidate distribution partner later, not a v1 dependency. |

Market read: the gap is a *universal, shareable, cross-chain* registry. Every local player is single-chain and login-gated, so gift-givers cannot coordinate.

## Parked

| # | Question | Why parked |
|---|---|---|
| P1 | Other occasions (wedding, birthday) | Baby is the wedge. Revisit after visuals. |
| P2 | Real retailer integrations and contracts | Needs a working demo first. |
| P3 | Real payments, PSP selection, invoicing, tax | POC mocks money entirely. |
| P4 | Cloud architecture | Local Docker microservices first, per project priority. |
| P5 | Native apps | Web only. Mobile-first responsive web is enough. |

## Open

Carried forward from the council, not blocking the Figma Make prompt pack.

| # | Question | Council positions |
|---|---|---|
| O1 | Paste-a-URL fidelity in the POC | All four chains run Shopify and currently expose public product JSON, so live cards are cheap. That stretches D4's "mocked catalogs". Decide when the POC plan is written, not now. |
| O2 | Thank-you channel | Product wants an optional guest phone with an explicit reason. Adversary wants no phone ever, only copy-ready text the couple pastes. D13 partially resolves this in the opposite direction: the couple's details are revealed to the guest, not the reverse. |
| O3 | Brand posture on the guest page | Neutral cross-chain with per-item chain marks is assumed. Alternatives are white-label per retailer, or our brand with chains in fine print. |
| O4 | Phase success criterion | Adversary's proposal: five of eight real Israeli parents say they would share the link in their birth-announcement group. The alternative, internal aesthetic sign-off, produces a different design. |
