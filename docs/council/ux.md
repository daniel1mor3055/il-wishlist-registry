# UX brief

## Goals

1. A guest who taps a WhatsApp link on a phone understands whose registry this is in under 3 seconds and completes a gift in under 90 seconds, with no account, no app, no login wall.
2. Emotional register first: this is a personal moment, not a storefront. Warm, specific, one couple's voice. Money moments are the only places where the UI deliberately turns calm, plain and bank-like so paying feels safe.
3. Nobody double-buys and nobody is embarrassed. Claim state is public; giver identity is public only to the couple.
4. A couple can go from zero to a shareable, credible cross-chain registry in one sitting on a phone, and can see the whole gift picture afterwards.
5. Hebrew-native, RTL-native. Not a mirrored English layout.
6. The retailer widget is the acquisition wedge: a shopper with no registry can start one from a product page without losing the product.

## Must-haves for v1 design

Design at 390px first. Desktop = same content, centered max-1120px, 3-col item grid, sticky couple/summary rail on the **right**. Bottom sheets on mobile become centered modals on desktop. Sample couple for all mocks: **נועה ואיתי** (Noa & Itai), due 12 בפברואר 2026.

### Surface 1 — Public guest registry (flow spine: G1 → G2 → G3 → {G4 | G5 | G6} → G7 → G8 → G9)

| ID | Screen | Job | Primary CTA (Hebrew, gloss) |
|---|---|---|---|
| G1 | Hero / land | Couple photo, names, due date, one-line story, claim progress, "how this works" in 3 short lines | `לראות את הרשימה` (see the list) |
| G2 | Item grid + filter bar | Sticky chips: `הכול` / `מה שעוד חסר` (still needed) / `עד ₪100` / `₪100–₪300` / `מעל ₪300` / `מתנות משותפות` (group gifts) / `שי` (cash). Sort: `לפי חשיבות` (by priority), `מהמחיר הנמוך לגבוה`. Categories: לינה, האכלה, ניידות, רחצה והחתלה, ביגוד, צעצועים | `לפרטים` (details) |
| G3 | Item sheet | Image, long name, price, store badge (שילב / מוצצים / עגליס / בייבי סטאר), priority badge (`חובה` must-have / `רצוי` wanted / `נחמד שיהיה` nice to have), quantity line, couple note | `אני קונה את זה` (I'm buying this) |
| G4 | Reserve / buy | Two-step: reserve, then outbound `לרכישה באתר שילב` (buy at Shilav) and return marker `כבר קניתי` (I already bought it). Optional first name only | `לשמור לי את המתנה` (hold this for me) |
| G5 | Group gift sheet | Funding meter, `נותרו ₪550 מתוך ₪1,290` (₪550 left of ₪1,290), `6 אורחים כבר השתתפו`, amount presets + free amount, explicit "any amount helps" line | `להשתתף במתנה` (join this gift) |
| G6 | Cash envelope sheet | One plain cash gift (`שי`), no named fund and no shop cards; amount presets, then contact reveal | `לשלוח שי` (send cash) |
| G7 | Blessing composer | Optional name + free text. Placeholder: `כמה מילים מהלב לנועה ואיתי…`. Field label `השם שלך (לא חובה)`. Opt-in toggle `להציג את הברכה בעמוד הברכות` | `לצרף ברכה` (attach blessing) |
| G8 | Mock payment | Plain, high-contrast, no illustrations. Amount, item, `התשלום מאובטח`, `אין שמירה של פרטי כרטיס`, demo strip `בהדגמה הזו לא מתבצע חיוב אמיתי` | `לאשר ולשלם` (confirm & pay) |
| G9 | Confirmation | `תודה, רשמנו את המתנה שלך` + what happens next + gentle share nudge, no upsell grid | `לשתף את הרשימה` (share) |
| G10 | Blessings page | Read-only wall of opted-in blessings; reachable from G1 | `לכתוב ברכה` (write a blessing) |
| G11 | Error / edge shell | Not found, closed, offline, retry (see state table) | `לנסות שוב` (try again) |

### Surface 2 — Couple editor (flow spine: C1 → C2 → C3/C4 → C5 → C6 → C7 → C8 → C9 → C10)

| ID | Screen | Job | Primary CTA |
|---|---|---|---|
| C1 | Create wizard, 3 steps | `מי אתם` (who you are) → `התאריך המשוער ללידה` (due date) → `מאיפה נתחיל` (starter list by category or blank) | `נתחיל את הרשימה` (start the list) |
| C2 | Editor home | Sectioned list, drag to reorder, progress ring, three empty-state prompts | `הוספת פריט` (add item) |
| C3 | Add item | Three tabs: `לחפש בחנויות` (search stores, mock catalog), `להדביק קישור` (paste a link, shows parsed preview), `להוסיף ידנית` (manual) | `להוסיף לרשימה` |
| C4 | Item settings | Priority, `כמה נשמח לקבל` (quantity), couple note, `לאפשר מתנה משותפת` with hint `מומלץ בפריטים מעל ₪400` | `לשמור` (save) |
| C5 | Bit/Paybox fund | Toggle שי, one phone, display name; explainer that money goes directly to the couple. We do not sell gift cards | `לשמור` |
| C6 | Story & cover | Photo, 2-line story, `כמה מילים עלינו`, privacy of address | `לשמור` |
| C7 | Preview as guest | Real guest render inside a device frame, banner `זו התצוגה שהאורחים רואים` (this is what guests see) | `חזרה לעריכה` (back to editing) |
| C8 | Share | WhatsApp-first. Prefilled: `היי, פתחנו רשימת לידה — הכול מרוכז בקישור אחד:` + copy link, QR for print | `לשתף בוואטסאפ` |
| C9 | Gift tracker | Table: פריט / מי / מתי / סטטוס / תודה. Status chips `נתפס` (taken), `נרכש` (purchased), `התקבל` (received). Filter `ממתין לתודה` (awaiting thanks) | `לשלוח תודה` (send thanks) |
| C10 | Thank-you composer | Editable template `תודה רבה על {פריט} — ממש התרגשנו.`, per-guest, batch-friendly | `לשלוח` (send) |
| C11 | Settings | `לעדכן שהתינוק נולד` (announce birth), `לסגור את הרשימה` (close), visibility, delete | `לשמור` |

### Surface 3 — Retailer embed widget

| ID | Screen | Notes |
|---|---|---|
| R1 | Button on chain PDP | Secondary-weight button under "add to cart", host-brand-neutral: `הוספה לרשימת לידה` (add to birth registry). Never outshouts the retailer's own CTA |
| R2 | Sheet, has registry | Product thumb + `לאיזו רשימה להוסיף?`, quantity, then `נוסף לרשימה שלכם` with `לצפייה ברשימה` |
| R3 | Sheet, no registry | `עוד אין לכם רשימת לידה?` + one-field lite create (names) + `לפתוח רשימה ולהוסיף את הפריט`. Item is carried in, never lost. Ends on `פתחנו לכם רשימה — הפריט הראשון כבר בפנים` with share nudge |
| R4 | Widget states | Skeleton on load; failure `לא הצלחנו להתחבר כרגע` with retry; widget must fail closed and never block the retailer's page |

### State inventory (every one of these needs a designed frame)

| State | Where | Treatment | Hebrew string (gloss) |
|---|---|---|---|
| Empty registry | G1/G2 | No grid. Warm illustration-free card + blessing CTA | `נועה ואיתי עוד מכינים את הרשימה. אפשר להשאיר ברכה בינתיים` (still preparing; leave a blessing) |
| Single item | G2 | One full-width hero card, never a lonely grid cell; funds/blessing below | `בינתיים יש פריט אחד ברשימה` (one item so far) |
| Fully claimed | G2 | Celebratory band above list, שי promoted | `כל הפריטים ברשימה נתפסו. אפשר עוד לתת שי` |
| Reserved by someone else | G3 card + sheet | Muted card, badge, CTA demoted to secondary | `נתפס` (taken) / `אורח אחר כבר לקח את זה` + `להשתתף בקופה במקום` (contribute instead) |
| Group gift partially funded | G3/G5 | RTL meter, remaining amount is the headline, not the percent | `נותרו ₪550 מתוך ₪1,290` |
| Group gift complete | G3/G5 | Full meter, closed CTA, thanks line | `המתנה הושלמה. תודה לכל מי שהשתתף` |
| Quantity partially fulfilled | G2/G3 | Counter chip, CTA stays live | `נשארו 2 מתוך 4` (2 of 4 left) |
| Out of stock | G3 | Price stays, CTA swaps to alternatives | `אזל מהמלאי בשילב` + `לחפש בחנות אחרת` / `לתת שי במקום` |
| Broken image | G2/G3 | Branded 1:1 placeholder with category glyph + product name. Never a gray box with alt text, never a layout shift | (no error copy) |
| Long Hebrew name | G2/G3 | 2-line clamp with reserved min-height; full name in sheet; badges wrap, never truncate | `עגלת תאומים משולבת עם סלקל…` |
| Closed registry | G11 | Read-only archive, blessings still visible | `הרשימה נסגרה. תודה לכל מי שהשתתף` |
| Not found | G11 | Suspect a truncated WhatsApp link | `הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו` |
| Network failure, browsing | G2 | Inline retry row, keeps cached items | `משהו נתקע. לנסות שוב?` |
| Network failure, mid-payment | G8 | Safety first, blocking and explicit | `לא הצלחנו להשלים את התשלום ולא בוצע חיוב` (not completed, no charge made) |
| Post-birth | G1 | Hero flips to announcement, list re-sorts to "useful now", nice-to-haves fold | `יעל נולדה! הרשימה עדיין פעילה — אלה הדברים שעוזרים לנו עכשיו` |
| Duplicate reserve race | G4 | Optimistic UI must be reversible | `בזמן שמילאת, אורח אחר לקח את הפריט. אפשר לבחור מתנה אחרת` |

### RTL specifics Figma Make gets wrong by default

- `dir="rtl"` at root; logical properties only (start/end, never left/right). Nav drawer and sheets enter from the **right**; overflow menus anchor right; toast text right-aligned with close affordance on the **left**.
- Chevrons: "back" points **right** (`‹` mirrored), "forward"/"more" points **left**. Mirror arrows, back, share, indent, next/prev. Do **not** mirror checkmarks, hearts, gift box, clock, store logos.
- Progress bars, funding meters and step indicators fill **right to left**, starting flush at the right edge. Step 1 of the wizard sits at the far right.
- Card interiors: thumbnail on the leading (right) edge, text block right-aligned beside it, price and CTA on the trailing (left) edge. Horizontal carousels start at the rightmost card and scroll leftward.
- Numbers, prices, dates and Latin brand names are LTR runs inside RTL text and must be bidi-isolated as single tokens: `₪149`, `₪1,290`, `₪100–₪300`, `12.2.2026`, `Maxi-Cosi`. Shekel sign precedes the digits. Never let a price split across a line break.
- Prefer `12 בפברואר 2026` over dotted dates in body copy; dotted form only in dense tables where it is isolated.
- Truncation: ellipsis renders at the visual **left** end. Hebrew does not hyphenate, so use 2-line clamp with reserved height rather than single-line ellipsis in grids. Never truncate a price, a status badge or a remaining-amount string.
- Typography: Hebrew-first family (Heebo / Assistant / Rubik), line-height ~1.5, no italics, no all-caps or letter-spacing for emphasis (Hebrew has no case) — use weight and size. Body minimum 16px.
- Forms: labels and helper text right-aligned; phone/amount inputs stay LTR internally with right-aligned label; validation icon on the leading (right) side of the field.

### Emotional register

Guest surfaces read like a message from friends: first person plural, no marketing superlatives, no urgency, no "shop now", no discount language, no scarcity timers. Photography over illustration. The single tonal shift is at G5/G6/G8, where the UI becomes plainer and more explicit — amount, recipient, what happens next, security line — because the person is about to hand over money on a page they have never seen before. Confirmation returns to warm and closes the loop on the relationship, not the transaction.

## Non-goals

- Guest accounts, guest login, saved guest profiles, guest-to-guest visibility of who gave what.
- Real payment rails, real retailer APIs, shipping/address flows, price tracking, cart or multi-item checkout. We do not sell gift cards.
- Occasions other than baby; any English UI; native app patterns; onboarding tours; gamification, badges, leaderboards.
- Comments/social feed, guest-to-guest chat, item requests by guests, registry search/discovery directory.
- Dark mode and accessibility audit as separate deliverables in this phase (contrast still meets AA in the specs).

## Top 5 risks

1. **Mocked money on a personal page reads as a scam.** An unbranded page asking for ₪550 from a WhatsApp link is exactly the shape of a fraud attempt. Under-designed trust affordances at G8 kill conversion silently.
2. **Reservations cannot be enforced without accounts.** Guests who reserve and never buy freeze the best items; guests who buy offline never mark it. Both produce double-buys, which is the one failure the product exists to prevent.
3. **Group gifting is misread in RTL.** Right-to-left meters plus bidi-flipped amounts make "₪550 remaining" look like "₪550 collected". Guests either think the gift is done or think they must fund it alone.
4. **Figma Make LTR bleed.** Mirrored-but-wrong output is worse than obviously broken: correct-looking screens with left-anchored meters, left chevrons, reordered price ranges and right-side ellipses will get approved and then baked into the build.
5. **Cold start on both sides.** Empty and single-item registries get shared anyway, and the retailer widget will generate one-item registries by design. If the empty and near-empty states are not as designed as the full state, the first guest impression is a broken page.

## Open questions for the human

1. **Reservation lifecycle.** (a) Soft reserve, never expires; (b) soft reserve, auto-release after 7 days with a nudge to the guest; (c) two-step reserve then `כבר קניתי` confirmation, auto-release at 14 days if unconfirmed; (d) no reservation at all, purchase-marking only.
2. **Blessing visibility.** (a) Private to the couple only; (b) public wall, opt-in per guest (assumed in this brief); (c) public by default with opt-out; (d) couple-moderated queue before publishing.
3. **How honest the POC is about fake money.** (a) Persistent demo strip `בהדגמה הזו לא מתבצע חיוב אמיתי`; (b) fully realistic fake checkout with no disclaimer, for clean demo video; (c) mocked Bit/PayBox handoff screen; (d) no payment at all — `לשלם ישירות לנועה ואיתי` with manual marking.
4. **Post-birth transition.** (a) Auto-flip on the due date; (b) couple toggles manually in C11 (assumed); (c) announcement flow with baby name and photo; (d) auto-close the registry 60 days after birth.
