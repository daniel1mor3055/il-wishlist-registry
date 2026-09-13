# P1 enriched — public guest registry

Paste **only** the fenced block into Figma Make as the first prompt. Do not paste this surrounding commentary.

This replaces the short P1 in [prompts.md](prompts.md). After the first render, go back to that file for P2 onward (states), then the couple editor, then the widget.

Kept as sent, because it is the prompt that produced the render we reviewed. Parts of it are now superseded and should not be re-pasted as written: the priority badges (`חובה` / `רצוי` / `נחמד שיהיה`) are gone per D27; card G is a plain cash envelope with no target and no meter rather than `קופה לעגלה` per D28; there is no shop-card tile; Bit and PayBox are two independent phone numbers, not XOR, and G8 shows one copy row per live rail (D50). [p3-missing-states.md](p3-missing-states.md) opens with the two prompts that undo D27/D28.

What this prompt is for: one populated, published registry, mobile 390px, Hebrew RTL, guest-only. It is not the couple editor and not the retailer widget.

What to check before iterating: people-first hero (couple above any product logo); no checkout or card fields anywhere; funding meter fills from the **right**; back chevron points **right**; "נותרו ₪550" reads as remaining, not collected; product cards look richer than money tiles; every string is Hebrew.

---

```
Build a mobile-first Hebrew website: a public baby gift registry page ("רשימת לידה") for one Israeli couple. This is the guest view only. A 60-year-old aunt opens it from a WhatsApp birth-announcement link, on a phone, having never heard of this site. In the first 3 seconds she must understand whose list this is and that she does not need to sign up or enter a credit card. In under 90 seconds she should be able to pick a gift.

This product is a coordination layer, not a shop. It never processes payments. There is no checkout, no cart, no credit-card field, no CVV, no expiry date, no order summary, no "pay now", no Apple Pay / Google Pay button, no fake PSP sheet. Guests either leave to a shop's own website, or send money themselves via Bit or PayBox using a phone number shown on the page, then tap a confirmation. Reservation state is public so nobody buys the same thing twice. Who gave what is never shown to other guests.

The couple is נועה ואיתי, expecting a girl named יעל, due 12 בפברואר 2026, living in תל אביב. The registry is already published. Default framing on items: "נשלח אחרי הלידה".

Brand posture: people-first and cross-chain. The couple's photo and names sit above everything. Our product name, if shown at all, is a tiny quiet wordmark in the footer, never in the hero. Each product card is marked with its shop name as a small text chip, not a logo lockup. Shops: שילב, מוצצים, עגליס, בייבי סטאר.

Emotional register: a personal message from friends, not a storefront and not a baby-brand catalog. First person plural. No marketing superlatives, no urgency, no scarcity timers, no discounts, no "קנו עכשיו", no confetti, no baby-pink, no baby-blue, no pastel gradients, no stock photos of crying newborns. Photography of the couple over illustration.

Visual tokens, use only these:
- Page background #FDFCFA
- Cards and sheets #FFFFFF
- Heading and body text #1F1D1B
- Secondary text #6B6560
- Primary buttons and active chips #2F6F62
- Funding meters and progress #E5A24B
- Confirmed / success #3E7D55
- Claimed / disabled #9A938C
- Borders #E8E3DC
Card radius 16px, button radius 12px, chips fully rounded (999px). 8px spacing grid. Type: Heebo, line-height 1.5. Scale: H1 28px, H2 22px, H3 18px, body 16px, small 14px. Weights 400, 500, 700 only. No italics, no all-caps, no letter-spacing. Body never below 16px. Mobile canvas 390px wide, with a realistic iOS status bar and a home-indicator safe area. Sticky bottom CTA on sheets. Bottom sheets enter from the bottom; on this mobile canvas they cover ~85% of the height.

Build these screens in this exact order, top to bottom. Put each screen on its own 390px frame, labelled in Hebrew on the canvas.

SCREEN 1 — Hero landing
Top to bottom:
1. Full-width couple photograph, 16:10, warm indoor light, two adults, no baby in the photo, no watermark.
2. H1: "רשימת הלידה של נועה ואיתי"
3. One-line story, body: "יעל בדרך, ואנחנו מתרגשים לקבל אתכם לתוך הסיפור הזה. כל מתנה עוזרת לנו להתכונן. באהבה, נועה ואיתי"
4. Small muted line: "תל אביב · נשלח אחרי הלידה"
5. Progress: a thin amber bar filling right-to-left, caption "נתפסו 4 מתוך 12 פריטים"
6. Section heading "איך זה עובד" then three short numbered lines, numbers as 1 2 3 in Western digits:
   "1. בוחרים מתנה מהרשימה"
   "2. קונים באתר החנות, או שולחים כסף ישירות אלינו בביט"
   "3. מסמנים שרכשתם — כדי שאף אחד לא יקנה את אותו דבר פעמיים"
7. Primary button, full width, #2F6F62: "לראות את הרשימה"
Footer: tiny muted "רשימת לידה" wordmark, no English.

SCREEN 2 — Item grid
Sticky filter row under a compact header that repeats the couple names in small type. Chips, right to left, "הכול" is active: "הכול" · "מה שעוד חסר" · "עד ₪100" · "₪100–₪300" · "מעל ₪300" · "מתנות משותפות" · "שי".
Two-column card grid. Product cards must look richer than money cards (photo, shop chip, priority badge) so money is the fallback, not the easiest tap.

Populate exactly these 7 cards, mixed states, do not invent extra items:

Card A — available product
Image: stroller. Name (2-line clamp): "עגלה משולבת צ'יקו מיסה שמנת"
Shop chip: "עגליס". Priority: "חובה". Price: "₪4,390". Caption: "נשלח אחרי הלידה"

Card B — group gift, partially funded (this is the expensive-item pattern)
Image: car seat. Name: "כיסא בטיחות Maxi-Cosi Pebble 360"
Shop chip: "שילב". Priority: "חובה". Price: "₪1,290"
Amber funding meter filling from the RIGHT. Headline on the card: "נותרו ₪550 מתוך ₪1,290". Small line: "6 אורחים כבר השתתפו". Badge: "מתנה משותפת"
Do not show who contributed or how much each person gave.

Card C — already taken
Image: bassinet. Name: "עריסת תינוק מתקפלת"
Shop chip: "בייבי סטאר". Priority: "רצוי". Price still visible: "₪890"
Whole card muted to #9A938C. Badge: "כבר נתפס". No primary button on the card.

Card D — quantity leftover
Image: bottles. Name: "ערכת האכלה אוונט נטורל"
Shop chip: "שילב". Priority: "נחמד שיהיה". Price: "₪189"
Chip: "נשארו 2 מתוך 4"

Card E — available mid-price
Image: baby monitor. Name: "מוניטור נשימה לתינוק"
Shop chip: "מוצצים". Priority: "חובה". Price: "₪349"

Card F — cheap available
Image: baby bath. Name: "אמבטיה לתינוק עם מעמד"
Shop chip: "מוצצים". Priority: "רצוי". Price: "₪79"

Card G — cash envelope (plainer than product cards: no lifestyle photo, just a simple envelope-like composition in the palette, no stock "money" clipart)
Title: "חיבוק בביט / פייבוקס 💛"
Subtitle: "כל סכום, ישירות אלינו"
No target, no meter, no per-guest amounts. Guest word is שי, never מעטפה. We do not sell gift cards.

Card anatomy, every product card: square image on top, then name, then a row with shop chip on the right and priority badge wrapping below if needed, then price on the left of that row. Never truncate a price or a badge. Latin brand fragments like Maxi-Cosi and Chicco stay as-is, isolated as LTR tokens inside the Hebrew name.

SCREEN 3 — Item detail sheet (opened from Card E)
Bottom sheet. Large image. Full name "מוניטור נשימה לתינוק". Price "₪349". Shop chip "מוצצים". Priority "חובה". Quantity "1". Couple note in first person: "זה אחד הדברים שבאמת יעזרו לנו בלילות הראשונים". Quiet muted disclaimer, never a warning colour: "המחיר מתעדכן באתר החנות". Small line "נשלח אחרי הלידה". Primary button: "אני קונה את זה".

SCREEN 4 — Reserve and handoff sheet (after tapping "אני קונה את זה")
Heading: "הפריט נשמר לך"
Body: "סימנו שהמוניטור שמור. עכשיו ממשיכים לאתר מוצצים לקנייה. כשתחזרו, נשאל אם רכשתם — כדי שאף אחד אחר לא יקנה אותו."
Optional field, label: "למי להגיד תודה?" placeholder: "השם הפרטי שלך (לא חובה)"
Primary button: "להמשיך לאתר מוצצים"
Secondary text button: "ביטול"
No timer, no countdown, no lock icon.

SCREEN 5 — Return confirmation modal
Plain, high-contrast, no illustration. Heading: "האם רכשת את הפריט?"
Sub: "הסימון עוזר לשאר האורחים לא לקנות את אותו דבר. אפשר לתקן אחר כך."
Primary: "כן, רכשתי"
Secondary: "עוד לא"
If "עוד לא", the item stays reserved, not purchased.

SCREEN 6 — Group gift sheet (opened from Card B)
Heading: "השתתפות במתנה"
Product row: tiny thumb + "כיסא בטיחות Maxi-Cosi Pebble 360" + shop chip "שילב"
Meter fills RIGHT to LEFT. The remaining amount is the headline, not a percentage: "נותרו ₪550 מתוך ₪1,290"
Line: "6 אורחים כבר השתתפו"
Do not list names. Do not list per-person amounts.
Amount chips: "₪100" "₪200" "₪500" and "סכום אחר"
Helper: "כל סכום עוזר — גם קטן"
Primary: "להשתתף במתנה"
After tapping, go to Screen 7 (contact reveal), not to a payment form.

SCREEN 7 — Cash envelope sheet (opened from Card G)
One plain cash gift, not a checkout. No shop cards.
Heading: "חיבוק בביט / פייבוקס 💛". Line: "כל סכום, ישירות אלינו". Amount chips "₪100" "₪200" "₪500". Button "לשלוח שי" which opens Screen 8.
No card fields.

SCREEN 8 — Contact reveal
This is the money moment. The UI becomes calmer, plainer, more explicit. Still no card fields.
Heading: "צריכים את הפרטים של נועה ואיתי?"
Body: "הכסף נשלח ישירות אליהם בביט או בפייבוקס."
A phone row, LTR digits inside RTL layout: "050-123-4567" with a button "העתקה"
Caption under the number: "מספר הביט של נועה"
Primary: "שלחתי"
Secondary: "עוד לא שלחתי"

SCREEN 9 — Private blessing then confirmation
Heading: "ברכה לנועה ואיתי"
Helper: "הברכה פרטית — רק הם רואים אותה"
Optional name, same label "למי להגיד תודה?"
Text area placeholder: "כמה מילים מהלב לנועה ואיתי…"
Button: "לצרף ברכה"
Then a confirmation state, warm again: heading "תודה, רשמנו את המתנה שלך"
Body: "נועה ואיתי יראו שרכשת, וידעו למי להגיד תודה."
No upsell grid, no "share this app".

Interactions:
- "לראות את הרשימה" scrolls to or opens Screen 2.
- Filter chips filter the grid (do not navigate away).
- Tap Card E → Screen 3 → "אני קונה את זה" → Screen 4. Treat "להמשיך לאתר מוצצים" as leaving the site; returning shows Screen 5.
- Tap Card B → Screen 6 → "להשתתף במתנה" → Screen 8.
- Tap Card G → Screen 7 → "לשלוח שי" → Screen 8 → "שלחתי" → Screen 9.
- Tap Card C does not start a purchase; the sheet only explains "אורח אחר כבר לקח את זה" with a secondary action "להשתתף בקופה במקום".
- Copy on Screen 8 shows a brief toast "המספר הועתק" with the toast close affordance on the LEFT.

Hard constraints:
כל הממשק בעברית בלבד, כיוון RTL מלא.
Direction is right-to-left: navigation, icons, progress bars, and card layouts all mirror.
Do not include any English UI text, placeholder lorem ipsum, or Latin dummy names.
Use realistic Israeli names, shekel prices formatted as ₪1,234, and Israeli retailer names.
Font: Heebo or Rubik. Numerals stay Western Arabic (1234), not Hebrew numerals.

RTL specifics you will get wrong unless you follow them literally:
- dir=rtl at the root. Sheets enter from the bottom; any side drawer would enter from the RIGHT.
- Back chevrons point RIGHT. Forward / more chevrons point LEFT.
- Mirror arrows, back, share, next/prev. Do not mirror checkmarks, hearts, gift boxes, clocks, or shop names.
- Progress bars and funding meters fill from the RIGHT edge toward the left. The filled (amber) portion is flush to the right.
- Card interiors: image on top; within rows, shop chip on the RIGHT, price on the LEFT.
- Prices, phone numbers, and Latin brand tokens are single unbreakable LTR runs: ₪79, ₪189, ₪349, ₪890, ₪1,290, ₪4,390, ₪100–₪300, 050-123-4567, Maxi-Cosi. Shekel sign precedes the digits. A price never wraps.
- Dates in body copy: "12 בפברואר 2026"
- Ellipsis, if any, sits at the visual LEFT. Hebrew does not hyphenate: 2-line clamp with reserved height, never a single-line ellipsis on names.
- Form labels right-aligned. Phone and amount inputs keep digits LTR. Validation icon on the RIGHT of the field.

Forbidden on every screen: English UI, lorem ipsum, guest login, sign-up wall, hamburger overflowing with settings, search directory of other registries, public guestbook, blessings wall, chat, cart icon, credit-card inputs, "secure checkout" badges, countdown timers on reservations, per-guest contribution amounts, retailer logos as a brand header, pink/blue baby clichés, dark mode.
```
