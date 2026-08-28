# Adversary brief

## Goals

The central imported assumption is that a registry is a thing people fill out before a baby shower. In the US that works because the shower is a scheduled event with a host, an invite list, and a norm that you buy off the list. Israel has no such forcing function. What Israel has instead:

- Money is the default gift, sent by Bit or Paybox, or handed in an envelope at the ברית / בריתה.
- The heavy items (עגלה, סלקל, מיטה, לול) are usually bought by grandparents directly, often at Shilav or Agalis with an in-branch consultation, and often as their own decision rather than off a list.
- A large share of families avoid bringing baby equipment into the house before the birth. This is not a fringe superstition; it is common enough to break a pre-birth registry's core loop.
- The real gifting spike is days 0-30 after birth, triggered by the announcement, not weeks -8 to -2.

So the honest goal is not "port Babylist." It is: **own the link inside the birth-announcement WhatsApp message.** That message already gets sent to 50-150 people, already carries social obligation, and today converts into an uncoordinated pile of Bit transfers and five identical swaddles. The registry is what sits behind that link. Everything in the design should be judged by whether it survives being opened on a phone, in Hebrew, by a 62-year-old aunt, from a WhatsApp group, in under 30 seconds.

That reframe fits inside the locked set (D1-D10) but changes the emphasis: the list is *built* pre-birth and *published* at the announcement, with delivery after the birth as the default. It turns the superstition from a blocker into a feature.

Secondary goal: prove the couple side is worth the effort of building a list at all. If the couple's payoff is only "avoid duplicates," that is not enough. The payoff has to be "the money and the stuff arrive in a shape we chose, and we know who to thank."

## Must-haves for v1 design

1. **The share artifact is a designed surface, not an afterthought.** The WhatsApp preview card (OG image, title, first line) is the highest-traffic screen in the product and most guests will judge legitimacy from it alone. Design it explicitly: couple photo, Hebrew names, one line. Suggested: `רשימת הלידה של נועה ודניאל — בלי הרשמה` ("Noa and Daniel's birth list — no signup").
2. **Trust above the fold, on the people not the brand.** The guest page opens with the couple's photo and names, not our logo. Add a persistent reassurance strip: `בלי הרשמה · בלי פרטי אשראי · המתנה נשלחת אחרי הלידה` ("No signup · no card details · gift ships after the birth"). An unknown Hebrew domain asking for money reads as a scam to an audience trained on Bit and delivery-SMS fraud.
3. **Delivery-after-birth as the default, visible on every item.** Copy: `נשלח אחרי הלידה` ("ships after the birth"). Plus a couple-side toggle to keep the list unpublished until they choose to publish. Without this, a meaningful slice of the market cannot use the product at all.
4. **Money never passes through us in v1.** Design the cash fund as a **ledger, not a wallet**. The guest taps `מתנת כסף`, gets a Bit/Paybox handoff to the couple's own number, comes back and taps `שילמתי בביט` ("I paid via Bit") with an optional amount and name. We record, we never hold. This kills the licensing question, kills the float, kills the partial-fund problem (the couple already has the money), and rides the rail guests already trust. It is strictly cheaper and strictly more credible than escrow.
5. **Group gifting is a progress bar plus the same Bit handoff.** One expensive item, one bar, `נאספו 620 ₪ מתוך 1,400 ₪`, contributors listed by first name. No goal deadlines, no refunds, no top-up logic, no what-happens-if-underfunded flows, because with a ledger model nothing is held and nothing needs unwinding.
6. **Add-any-URL is the catalog strategy.** The couple pastes a link from any Israeli or foreign site; we read OG tags for title, image, price. Curated mock content from Shilav / Motsetsim / Agalis / Baby Star appears as **starter templates** (`רשימת בסיס ללידה ראשונה`), not as integrations. This is exactly how Babylist actually won, and it needs zero retailer cooperation.
7. **Gift cards designed as first-class tiles, one partner deep, not four wide.** Mock BuyMe only. A `כרטיס מתנה` tile with denominations is the most likely real revenue line and the least likely to break.
8. **Guest data minimum: first name optional, blessing optional, nothing else.** No phone, no email, no address, no account. Ask for the name as `למי להגיד תודה?` ("who should we thank?") rather than as tracking; that framing raises fill rate and satisfies D7 without feeling surveilled.
9. **Reservation state public, identity private, no lock timers.** `כבר נתפס` ("already taken") on the tile. No 15-minute holds, no countdowns; a guest who sees a timer on a family gift page will leave.
10. **Mobile-only for the guest surface.** Desktop layout for the couple editor only. Half the design surface disappears and nothing is lost.

## Non-goals

- **Retailer embed widget (locked surface 3).** Cut from design. It is a partnership artifact drawn before a single partnership conversation happened. Replace with a one-page co-brand mock for sales meetings.
- **Real or simulated retailer catalog integration.** Cut. Even mock "API-shaped" flows train the team to expect access that these chains will not grant to an unknown competitor. Shilav already has its own login-gated registry; we are their rival, not their partner.
- **Affiliate commission as a revenue line.** Cut from all narrative. Israeli baby chains have no affiliate program at meaningful scale.
- **Any flow where we hold, escrow, or disburse funds.** Cut. Receiving payer funds for later transfer looks like a regulated payment service in Israel; a float held for weeks against an uncertain birth date is the worst possible shape to start with.
- **Card entry anywhere in v1.** Cut. Every money action hands off to Bit, Paybox, or the merchant's own checkout, all of which the guest recognizes.
- **Cash-fund goal amounts, deadlines, refunds, partial-fund resolution UI.** Cut. Artifacts of a wallet model we are not building.
- **Due date and baby name as required fields.** Cut. Data we do not need, on a population where the data is sensitive.
- **A separate blessings wall / guestbook.** Cut. The blessing is a field on the gift; a second surface doubles the empty-state problem.
- **Thank-you note automation, address collection, shipping tracking, multi-list, wedding and birthday occasions.** Cut. All are post-proof.
- **Public discoverability, SEO, search.** Cut. Lists are unlisted by default with a long random slug and noindex. Discoverability is a liability here, not a feature.

## Top 5 risks

1. **No ritual to attach to, so no distribution.** If the link does not land in the birth-announcement WhatsApp, nothing else matters — there is no shower invitation to carry it. Mitigation: design the share card and the "publish now" moment as the product's spine, and test the demo by asking real Israeli parents one question: would you send this link to your group? Anything less than a clear yes from most of them means stop.
2. **We are competing with a free, trusted, instant rail.** Bit and Paybox already solve "send the couple money" perfectly. Any friction we add to money movement loses. The ledger model concedes this fight deliberately: we do not try to beat Bit, we sit on top of it and add the thing Bit cannot do, which is coordination. Any future pivot back to holding funds needs a lawyer's read on payment-services licensing before a single screen is drawn.
3. **The link looks like phishing.** A skeptical guest sees an unfamiliar Hebrew domain, in a group message, mentioning money. Default assumption is a scam or a hacked account. This can cap conversion near zero regardless of visual quality. Mitigation: people-first page, no card fields, no signup, no OTP, explicit reassurance copy, and a share message the couple sends in their own words rather than boilerplate.
4. **Privacy exposure is asymmetric.** Names of pregnant women, due dates, guest names and gift amounts, in a jurisdiction where the Privacy Protection Law amendment that took effect in 2025 raised penalties and controller obligations sharply. A hobby-scale product can inherit real regulatory weight. Mitigation: collect almost nothing, unlisted URLs, no guest phone numbers ever, couple-controlled auto-hide after the event.
5. **The locked scope produces a broad, shallow demo.** Three surfaces plus a full hybrid gifting model at POC stage means every screen is 60 percent done and nothing is convincing. I am arguing D3 and D5 are dangerous as written. Mitigation: two surfaces, one gifting path built deep (product item plus Bit handoff plus one gift card), everything else as static states.

Honest read on the business model: if gift-card margin is the revenue, the product catalog *is* decoration — but it is load-bearing decoration. Nobody shares a link to a gift-card page. People share a link to "the things we need." The catalog earns the share; the gift card earns the money. Say that plainly in the PRD instead of pretending catalog breadth is the roadmap.

## Open questions for the human

1. **When does the gifting window open?** (a) Pre-birth, Babylist-style, accept that a chunk of the market opts out. (b) Built pre-birth, published at the birth announcement, ships-after-birth default — my recommendation. (c) Couple picks the mode explicitly at setup. (d) Post-birth only, simplest and narrowest.
2. **Who touches the money in the v1 design?** (a) Nobody: Bit/Paybox handoff plus couple confirmation ledger — my recommendation. (b) Gift cards only, bought through the merchant's own checkout, no cash path at all. (c) Real PSP as merchant of record for gift cards only, cash still handed off. (d) Mock it in the POC and defer the question — this is the trap, because the mock will silently encode escrow assumptions into the UX.
3. **Do we design the retailer embed widget now (D3)?** (a) Cut it, ship a one-page partner mock instead — my recommendation. (b) Design it, but label it a sales artifact with no POC path. (c) Keep it as locked and accept a thinner guest and couple surface.
4. **What counts as this phase succeeding?** (a) Five of eight real Israeli parents say they would share the link in their birth-announcement group. (b) One of the four chains agrees to a meeting on the strength of the mock. (c) Internal aesthetic sign-off on the Figma Make output. Pick one before the prompt pack is written, because (a) and (c) produce different designs.
