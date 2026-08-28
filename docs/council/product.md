# Product brief

## Goals

1. **Displace the envelope.** The Israeli birth-gift default is cash in an envelope or one chain's gift card. Both are safe, both waste money, neither tells the couple what they still need. Winning means one WhatsApp link causes forty guests to buy the right things across four chains without coordinating with each other.
2. **A populated registry in under three minutes.** The couple's blocker is not tooling, it is not knowing what a newborn needs. We must never show an empty "add your first item" state; we show a pre-filled list the couple edits down.
3. **Earn a stranger's credit card in forty seconds.** Every guest lands from a WhatsApp thread, on a phone, having never heard of us, and bounces at the first sign of an amateur site. Trust is the conversion mechanic, not a footer.
4. **Make the retailer story visible.** The embed widget exists this phase as a sales artifact for Shilav and מוצצים conversations, not as software.
5. **Design for a four-month life.** A registry is born around week 28, peaks at the ברית and the first home visit, and dies. Any feature that assumes a year of engagement is misdesigned.

## Must-haves for v1 design

Ranked. If we run out of time, we cut from the bottom.

**M1. The public guest page, mobile, in Hebrew that does not read like a translation.** This is the one screen that must be beautiful, because it is the only screen fifty people per registry ever see, the only screen where money is decided, and the screenshot that sells the company. Above the fold: couple photo, `רשימת הלידה של נועה ודניאל` (Noa and Daniel's birth list), a due-date line `עוד 6 שבועות ללידה` (6 weeks to due date), and `בלי הרשמה, בלי חשבון` (no signup, no account). Trust furniture is part of the design, not a later pass: named chain marks per item, ₪ price with `ללא עמלת אורח` (no guest fee), a payment-rail badge, and `המתנה נשלחת ישירות לבית של ההורים` (the gift ships straight to the parents' home).

**M2. Honest, public reservation state.** Every tile carries one of four visible states: available, `כבר נתפס` (already taken), partially funded with progress, fully funded. Giver identity stays private on the public page. This is the single feature a guest cannot get from an envelope, and the single reason a couple stops answering "what do you need?" in thirteen separate chats.

**M3. Money as a first-class tile, in the same grid as products.** A cash fund (`מעטפה דיגיטלית` / digital envelope, or `קופה משותפת` / shared pot) and couple-chosen gift cards sit beside the stroller, not in a separate tab. Israeli guests want to give money; forcing them to a secondary surface loses them. The design must also make an obviously nicer product tile than money tile, so money is the fallback and not the path of least resistance.

**M4. The checklist is core, not ornamental — it is our cold-start engine.** With no retailer APIs, the checklist is how a list gets populated: due date and birth number in, a starter template out (`חבילת לידה בסיסית` / basic birth package), auto-populated with mocked items from Shilav, מוצצים, עגליס, בייבי סטאר, grouped by when the item is needed. The couple removes and swaps. מוצצים already monetizes a checklist with no registry attached, which tells us the checklist is the demanded object and the registry is the upsell. Design artifact: the first-run flow with subtraction as the primary verb.

**M5. WhatsApp share kit.** Not a "share" icon. A designed link-preview card (couple photo, names, due date, Hebrew, rendered as WhatsApp renders it), an editable pre-written Hebrew message the couple sends to family groups, and a QR variant for the ברית and hospital visits. If the link preview is ugly, nothing downstream matters.

**M6. Gift tracker and a one-tap thank-you loop.** The couple sees item, giver name, blessing, and date in one table, plus a `לומר תודה` (say thanks) action that produces a ready Hebrew message naming the giver and the gift. Thank-you debt is real social pressure in Israeli families and is the couple's strongest reason to return post-birth.

**M7. Group gifting on expensive items.** Above roughly ₪600, a tile becomes `השתתפות במתנה` (join a gift) with a participant count and remaining amount. This is how a ₪3,000 stroller becomes reachable for a work group, and how we beat the envelope on the highest-value item in the category.

**M8. Lifecycle states driven by the due date.** Three designed states: pre-birth countdown; `נולד/ה!` (born!) banner the couple flips on, which reprioritizes the list toward months 0-3; and an archived state with a thank-you summary that stops accepting gifts gracefully. A stale registry full of taken items is a trust event for the late guest.

**M9. Manual add and cross-chain browse.** `הוספה מקישור` (add from a link) with a preview-and-fix step, plus browsing a mocked cross-chain catalog. Add-from-link is the honest answer to zero integrations and the reason we can claim "universal" while single-chain incumbents cannot.

**M10. Retailer embed widget as a single screen.** An `הוסיפו לרשימת הלידה` (add to birth list) button on a mock retailer product page, plus one attribution panel showing registry-driven orders. That is the whole BD pitch. No merchant dashboard.

## Non-goals

Cut from a Babylist parity list, with reasons:

- **Our own storefront, warehouse, checkout, and shipping.** Babylist's margin engine and its hardest asset. We route outbound to the chain and borrow the chain's existing trust. Reversing this later is a business decision, not a design one.
- **Browser extension / add-from-anywhere bookmarklet.** M9's paste-a-link flow covers the same job at a fraction of the surface area. Extensions also die on mobile, and Israeli gift shopping is mobile.
- **Baby shower invitations and event pages.** Israel does not run baby showers at meaningful scale; the gatherings that matter are the ברית, בריתה, and the first home visit, and those are organized in WhatsApp already. An invitation builder would be an American import.
- **Insurance-funded breast-pump flow (Babylist Health).** A pure artifact of US insurance. Israeli קופות חולים work nothing like this. Zero transferable value.
- **Editorial content hub, pregnancy week-by-week, baby-name tools, product reviews and ratings.** SEO plays that need staff and data we do not have. They dilute a registry demo into a portal.
- **Registry completion discount.** Requires signed retailer terms. Park until a chain says yes.
- **Guest accounts and guest gift history.** Locked out, and correctly: every account we ask a guest to create is conversion we hand back to the envelope.
- **Full co-owner accounts for the second parent.** Keep a shared edit link instead; both parents shop, neither wants a second password.
- **Gift receipts, returns, exchange handling.** The chain owns the transaction and therefore owns this. We must not imply otherwise in the guest UI.
- **Wedding, birthday, generic wishlists; native apps; multi-registry per user.** Locked or parked elsewhere; noted so the UX spec does not smuggle them in.

## Top 5 risks

1. **The money tile has no credible rail.** Half of our gifting model asks an unknown `.co.il` site for a credit card. If the mocked flow does not visually invoke a rail Israelis already trust, guests will abandon money items and we become a checklist app with a nice grid. Highest-severity risk in the brief; it is a design problem before it is a payments problem.
2. **Cash cannibalizes the product catalog.** This is a flag against locked D5: if `מעטפה דיגיטלית` is the easiest tile, most guests pick it, product purchases never happen, retailers see no attributed orders, and the entire B2B2C thesis behind the embed widget loses its evidence. Mitigation lives in tile hierarchy and default ordering, and must be an explicit UX constraint.
3. **Mocked catalogs flatter the demo and lie in production.** D4 locks mocks, which is right for a POC, but the design will imply live prices, stock, and shipping we cannot honor without integrations. A wrong price on the guest page is a trust event, and trust is our only moat. The UX spec needs a designed "price at the chain may differ" affordance from day one, not later.
4. **Per-registry two-sided cold start.** Every couple must learn a behavior Israel has no habit for, and then recruit dozens of guests who have also never used a registry. Nothing else on this list matters if first-run exceeds three minutes or if the first WhatsApp share does not look native.
5. **RTL Babylist is not Babylist.** Babylist's warmth comes from English editorial typography. Mirrored naively into Hebrew it reads cheap, which reads untrustworthy, which loses the money in risk 1. Separately, Shilav can bolt sharing onto its existing login-gated registry faster than we can sign anyone, so our cross-chain neutrality has to be legible on the guest page itself.

## Open questions for the human

**Q1. How does a guest fund a money item in the POC design?**
(a) Generic mocked credit-card sheet with a PSP trust badge. (b) Deep link to Bit or PayBox, so no card is ever entered on our site. (c) A pledge (`התחייבות`) the couple settles offline. (d) Money items appear on the guest page but are not fundable in the POC. Recommendation: (b), with (c) as the fallback state.

**Q2. Do shekel amounts appear on the public guest page?**
(a) Full amounts and fund progress, Babylist-style. (b) Progress only, expressed socially: `עוד 2 משתתפים` (2 more participants). (c) No money on the public page; amounts live only in the couple's tracker. Recommendation: (b) — Israeli family gift-value comparison is a real social hazard.

**Q3. How does the couple get a channel to say thank you, given guests have no account?**
(a) Ask the guest for an optional phone number with an explicit reason: `איך נוכל להגיד תודה?` (how can we thank you?). (b) No phone; the thank-you is copy-ready text the couple pastes into their own WhatsApp. (c) Public blessing wall (`לוח ברכות`) with couple replies and no private channel. Recommendation: (a) plus (b) as the always-available path.

**Q4. Whose brand does the guest page wear?**
(a) Neutral and cross-chain: our brand, each item marked with its chain. (b) White-label per retailer, so Shilav can ship it as their own registry. (c) Our brand only, chains reduced to fine-print attribution. This decides the widget's design and the BD story, and I do not think product should decide it alone. Recommendation: (a).
