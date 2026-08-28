# Figma Make prompt pack

Paste these into Figma Make in order. Each block between the fences is one prompt. Do not merge blocks: the master prompt is long by design, every follow-up is deliberately one change only.

Source of truth is [../prd.md](../prd.md). If Make produces something that contradicts the PRD, the PRD wins.

## How to run this

| Step | Prompts | Stop and check |
|---|---|---|
| 1 | Enriched P1 in [p1-enriched.md](p1-enriched.md) | RTL is genuinely right-to-left, not a mirrored English layout |
| 2 | P2 to P8 | Each state exists as its own view |
| 3 | P9, then P10 to P13 | Couple editor |
| 4 | P14, P15 | Widget prototype |
| 5 | A1 to A3 as needed | Audits and drift repair |

Rules while iterating: one change per prompt, 5 to 25 words. If Make starts inventing English copy or drifting off the palette, run A1 rather than nudging it repeatedly. First render lands around 60 to 70 percent; judge structure before detail.

---

## P1. Master prompt (public guest registry)

Do not use the short block below. Paste the fenced prompt in [p1-enriched.md](p1-enriched.md) instead. That version adds the sample catalog, exact Hebrew copy, mixed card states, the cash/voucher sheet, and harder "no checkout" / RTL constraints. The short block is kept only as a map of the original eight screens.

```
Build a mobile-first Hebrew web app: a baby gift registry ("רשימת לידה") that works across multiple Israeli baby shops. This first screen set is the PUBLIC GUEST VIEW of one couple's registry. The guest arrives from a WhatsApp link on a phone, has no account, never logs in, and never enters payment details anywhere in this product.

The couple is נועה ואיתי, expecting a girl named יעל, due 12 בפברואר 2026. Shops referenced on items: שילב, מוצצים, עגליס, בייבי סטאר.

Build these screens in this order:
1. Hero landing: couple photo, "רשימת הלידה של נועה ואיתי", one-line personal story, a progress line showing how much of the list is claimed, and a reassurance strip reading "בלי הרשמה · בלי פרטי אשראי · המתנה נשלחת אחרי הלידה". Below it, "איך זה עובד" in three short lines. Primary button: "לראות את הרשימה".
2. Item grid: two-column cards. Sticky filter chips: "הכול", "מה שעוד חסר", "עד ₪100", "₪100–₪300", "מעל ₪300", "מתנות משותפות", "כספיות ושוברים". Each card shows image, two-line product name, price, a small shop-name chip, and a priority badge ("חובה", "רצוי", "נחמד שיהיה").
3. Item detail bottom sheet: large image, full product name, price, shop chip, quantity line, a short note from the couple, a quiet grey line "המחיר מתעדכן באתר החנות", and a primary button "אני קונה את זה".
4. Reserve and handoff sheet: explains the item is now held for this guest, an optional first-name field labelled "למי להגיד תודה?", and a primary button "להמשיך לאתר שילב" that sends the guest to the shop's own site.
5. Return confirmation modal: asks "האם רכשת את הפריט?" with two buttons, "כן, רכשתי" and "עוד לא".
6. Group gift sheet: a funding meter, the headline "נותרו ₪550 מתוך ₪1,290", a line "6 אורחים כבר השתתפו", amount chips (₪100, ₪200, ₪500, "סכום אחר"), and a button "להשתתף במתנה".
7. Contact reveal sheet: heading "צריכים את הפרטים של נועה ואיתי?", showing a phone number for Bit or PayBox with a copy button "העתקה", explanatory text that the money is sent directly to the couple, and a confirmation button "שלחתי".
8. Blessing and confirmation: an optional name field and a private message field with placeholder "כמה מילים מהלב לנועה ואיתי…", noting the message goes only to the couple. Then a confirmation state reading "תודה, רשמנו את המתנה שלך".

Critical product rule: this app never processes payments. There is no checkout, no card field, no CVV, no order summary. Guests either go out to a shop's own website, or send money directly to the couple via Bit or PayBox using the revealed phone number, and then self-report what they did. Reservation state is public so nobody buys the same thing twice, but the identity of who gave what is never shown to other guests.

Visual style: warm, personal and calm, like a message from friends rather than a storefront. Not a baby-cliché palette: no pink, no baby blue, no pastel gradients. Photography over illustration. Background #FDFCFA, surfaces #FFFFFF, text #1F1D1B, secondary text #6B6560, primary green #2F6F62 for buttons and active chips, amber #E5A24B for funding meters and progress, success #3E7D55, muted grey #9A938C for claimed items, borders #E8E3DC. Card radius 16px, button radius 12px, chips fully rounded. 8px spacing grid. Type scale: H1 28px, H2 22px, H3 18px, body 16px, small 14px, weights 400/500/700. Mobile canvas 390px wide.

Interactions: filter chips filter the grid; tapping a card opens the detail sheet from the bottom; "אני קונה את זה" opens the reserve sheet; returning from the shop triggers the confirmation modal; amount chips select a value in the group gift sheet; the copy button copies the phone number and shows a brief confirmation.

כל הממשק בעברית בלבד, כיוון RTL מלא.
Direction is right-to-left: navigation, chevrons, progress bars, funding meters, step indicators and card layouts all mirror. Progress and funding meters fill from the right edge leftward. Back chevrons point right. Do not mirror checkmarks, hearts, gift boxes or clocks.
Card interiors: thumbnail on the right edge, text right-aligned beside it, price and action on the left edge.
Do not include any English UI text, no lorem ipsum, and no Latin dummy names.
Prices are single unbreakable tokens with the shekel sign before the digits: ₪149, ₪1,290, ₪100–₪300. Never break a price across lines.
Dates in body copy read as "12 בפברואר 2026".
Font: Heebo. Line height about 1.5. No italics, no all-caps, no letter-spacing for emphasis; use weight and size instead. Body text minimum 16px.
Hebrew does not hyphenate: clamp product names to two lines with reserved height rather than a single-line ellipsis.
```

**Check before moving on:** funding meter fills from the right; back chevron points right; no English anywhere; no card fields; prices unbroken.

---

## P2 to P8. The funds sheet, then the states, one change each

Send this one first. It completes the hybrid gifting model, since the master prompt covers products and group gifts but not cash funds or gift cards.

```
Add a "כספיות ושוברים" sheet: named funds like "קופה לעגלה" with amount chips, and gift-card options from שילב and מוצצים. Cash funds open the contact reveal; gift cards send the guest to the shop's own site.
```

The rest are states. Figma Make defaults to the happy path and to full lists, so each must become its own view.

```
Add an empty-registry state: no grid, one warm card reading "נועה ואיתי עוד מכינים את הרשימה".
```

```
Add a claimed-item state: card muted grey with a badge "כבר נתפס" and its button demoted to secondary.
```

```
Add a completed group gift state: meter full, button disabled, text "המתנה הושלמה. תודה לכל מי שהשתתף".
```

```
Add a partial quantity chip on cards reading "נשארו 2 מתוך 4".
```

```
Add an out-of-stock item state: price stays, button swaps to "לחפש בחנות אחרת".
```

```
Add a post-birth hero variant: "יעל נולדה! אלה הדברים שעוזרים לנו עכשיו".
```

```
Add an error screen: "הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו".
```

Optional extras if the above land cleanly, still one at a time:

```
Add a single-item state: one full-width hero card instead of a two-column grid.
```

```
Add a fully-claimed banner above the grid: "כל הפריטים ברשימה נתפסו. אפשר עוד להשתתף בקופה".
```

```
Add a broken-image placeholder: branded square with a category glyph, never a grey box.
```

---

## P9. Surface 2: couple editor

Send this as a new screen set, only after the guest surface is agreed.

```
Now add a second screen set: the COUPLE EDITOR, the private side where נועה ואיתי build and manage the registry on a phone. Same visual language, same RTL rules, same palette and type scale as the guest view.

Screens in this order:
1. Create wizard, three steps, step 1 at the far right: "מי אתם", then "התאריך המשוער ללידה", then "מאיפה נתחיל" offering a starter template or a blank list. Button "נתחיל את הרשימה".
2. Editor home: the list grouped by category with drag handles, a progress ring, and a prominent draft banner reading "הרשימה עדיין לא פורסמה" with a button "לפרסם את הרשימה". Primary action "הוספת פריט".
3. Add item, three tabs: "לחפש בחנויות" showing a mock cross-shop catalog, "להדביק קישור" showing a pasted link resolving into a preview card, and "להוסיף ידנית".
4. Item settings: priority selector, a quantity field "כמה נשמח לקבל", a note field, and a toggle "לאפשר מתנה משותפת" with the hint "מומלץ בפריטים מעל ₪400".
5. Funds and payment details: create a named fund such as "קופה לעגלה", choose gift-card types, and enter the Bit or PayBox phone number that guests will see. Explain that money goes directly to the couple and never through the app.
6. Preview as guest: the guest view rendered inside a phone frame with a banner "זו התצוגה שהאורחים רואים".
7. Publish and share: the moment the couple publishes with their birth announcement. Show a WhatsApp-style link preview card with the couple photo, names and one line; an editable Hebrew message; a copy-link button; and a QR code option. Primary button "לשתף בוואטסאפ".
8. Gift tracker: a table with columns פריט, מי, מתי, סטטוס, תודה. Status chips "נתפס", "נרכש", "התקבל". A filter "ממתין לתודה". Each row has a "לומר תודה" action, and a control to release an item that was reserved but never bought.

Amounts given by individual guests appear only in this tracker, never on the public guest page.
```

**Check:** wizard step 1 sits at the far right; the draft banner is unmissable; the WhatsApp preview card looks like a real WhatsApp preview.

---

## P10 to P13. Couple editor follow-ups

```
Add an empty editor state: a starter template suggestion instead of a blank list.
```

```
Add a published state to the editor home: replace the draft banner with a share bar.
```

```
Add a thank-you composer: editable Hebrew text "תודה רבה על {פריט} — ממש התרגשנו".
```

```
Add a settings screen with "לעדכן שהתינוק נולד" and "לסגור את הרשימה".
```

---

## P14. Surface 3: retailer widget prototype

```
Add a third small screen set: a RETAILER WIDGET PROTOTYPE. This is a UI concept only, with no real partnership and no retailer branding. Use a visibly generic mock shop product page, never a copy of a real chain's storefront, and do not include any analytics, attribution or merchant dashboard.

1. Generic mock product page for a stroller, in Hebrew and RTL, with the shop's own "הוספה לסל" as the dominant button and a smaller secondary button below it reading "הוספה לרשימת לידה".
2. Sheet when the shopper already has a registry: product thumbnail, "לאיזו רשימה להוסיף?", a quantity stepper, then a success state "נוסף לרשימה שלכם".
3. Sheet when the shopper has no registry: "עוד אין לכם רשימת לידה?", a single names field, and a button that creates the list with this item already inside, ending on "פתחנו לכם רשימה — הפריט הראשון כבר בפנים".

The secondary button must never visually outshout the shop's own add-to-cart button.
```

---

## P15. Desktop pass

Run this last, once mobile is agreed.

```
Add a desktop layout: same content centred at max 1120px, three-column item grid, sticky summary rail on the right.
```

---

## Audit and repair prompts

Use these instead of nudging Make repeatedly.

**A1. Palette and token drift**

```
Analyze your current color usage, list every colour token in use, then regenerate using only the palette I specified.
```

**A2. RTL audit**

```
Audit every screen for RTL correctness: meters fill from the right, back chevrons point right, ellipsis at the left, prices unbroken. Fix what is wrong.
```

**A3. English bleed**

```
Find every English string in the UI and replace it with natural Hebrew. No transliterations.
```

---

## What to look for when reviewing output

Ranked by how expensive the mistake is to discover late.

1. **RTL that is mirrored but wrong.** Correct-looking screens with left-anchored funding meters or left-pointing back chevrons will get approved and then baked into the build. Check section 8 of the PRD literally, line by line.
2. **A checkout appearing anywhere.** Make will want to add one because every shopping UI it has seen has one. There is no checkout in this product. Delete it on sight.
3. **The group gift meter reading backwards.** "נותרו ₪550" must read as remaining, not collected. This is the single most misreadable element in the product.
4. **Copy that sounds translated.** The guest page has to sound like two people, not like a marketing team. This is the difference between trustworthy and phishing-adjacent.
5. **States quietly missing.** Make will render the full, happy, populated list forever unless each state is demanded separately.
