# UX brief

## Goals

- A parent who is already on a product page can copy that URL and get a guest-ready card without installing anything.
- The card they confirm is the card a guest taps: image, title, price, chain, and the URL behind `להמשיך לאתר {chain}`.
- A bad read is fixed before save, or refused, so a collection, a cart, or a guessed price never becomes the handoff.
- Paste, confirm, paste again. Success stays on C3.
- Failure copy is one quiet sentence in ink-muted. The pink button is the only loud control. Danger red stays on a refused save.

## Must-haves for v1 design

**The one interaction.** The first region of C3 (`להוסיף פריט`) is a paste field, above the existing tabs `מהחנויות` and `משהו אחר`. Safari's share-sheet Copy and the address bar both end as a paste into that field; sharing to WhatsApp does not. Desktop is the same field and Command-V. A third tab loses: the last-used tab is often search, and that box is Hebrew RTL.

**Empty.** Label `קישור מהחנות`, right-aligned. While empty the input stays RTL so `הדביקו קישור למוצר` sits on the right; with a URL it switches to `dir="ltr"`. Helper: `מעתיקים מהחנות ומדביקים כאן`. No autofocus — the keyboard covers the helper. Resolve only from a paste or typed text, so iOS never shows "Allow Paste".

**Paste.** Trim. If the text is a WhatsApp forward, take the first `http` URL and put that URL in the field. A paste with no URL leaves what they pasted and says `זה לא קישור. העתיקו את הכתובת עצמה.`

**Resolving.** The URL stays, middle-truncated, host visible (`shilav.co.il/…/עגלה`). Under it, a skeleton in guest-card geometry: image on the right, two lines, price slot on the left (section 8). `בודקים את הקישור`, then `עדיין בודקים` after about two seconds. A new paste cancels the read. A seed hit and a live Shopify read are the same card (D22).

**Confirm.** The skeleton becomes that card. Title, price as one unbreakable `₪1,290`, chain chip, `לראות באתר שילב`, and `המחיר מתעדכן באתר החנות`. No stock line (D26). Primary `להוסיף לרשימה`. On success: clear the field, `נוסף לרשימה`, stay on C3.

**Fix before that tap.** Title and price edit in place on the card. Category chips sit under it and are optional. The chain chip does not edit. The URL does not edit: pasting again replaces the draft. Save stores their edits plus the post-redirect product URL (`variant` kept, tracking params dropped). Closing C3 drops the draft.

**Not a product.** On a known chain, home, cart, search, a content page, or a collection is refused (`/collections/…/products/…` is a product). `זה לא עמוד של מוצר. פתחו מוצר אחד והעתיקו שוב.` Add stays off. A collection must not become a card: that URL is what the guest would open.

**Variant.** A variant in the URL is part of the title and of the stored URL. A URL without one stays the parent product, with `בלי מידה או צבע — האורח יבחר באתר.` A title they rewrite does not change the URL.

**Not in the seed.** A live read that returns a product is the confirm card. A product URL that 404s is `לא מצאנו מוצר בקישור הזה.` Add stays off.

**Unknown chain.** No chain chip and no invented Hebrew name. `את החנות הזאת לא קראנו. אפשר למלא ידנית — הקישור נשמר.` Title, price, and category open under the field; the paste field is the link. Handoff copy with no chain is `להמשיך לאתר`.

**Timeout.** The same manual fields, the URL kept, `החנות לא ענתה.`, and `לנסות שוב`. Beside them: `לא הצלחנו לבדוק. אם תשמרו, האורחים יפתחו את הקישור כמו שהוא.` Save is allowed once the title has two characters. An unchecked URL is a choice they can see.

**Image missing.** The existing placeholder: category glyph and name, fixed size, no gray box. Save allowed. No upload.

**Price missing.** The price slot stays empty, placeholder `בשקלים, לא חובה`. Save allowed. An empty price is not `₪0`. The disclaimer appears only once a price exists. No price, no group-gift hint.

**English title.** The shop's title is the title. Latin runs stay LTR inside the RTL card. If there is no Hebrew: `השם כמו באתר. אפשר לשנות.`

**Wrong parse.** They correct title, price, and category on the card, then save. The saved row is what they confirmed.

**Duplicate.** The same stored URL, variant included, is `הפריט כבר ברשימה` and `לפתוח את הפריט`. No second row. A different variant is a different item. The paste screen does not say `כבר נתפס`; a hold shows up on the item they open (D7).

**Dead link later.** Add-time check is `לראות באתר {chain}`. We cannot see a later 404, so the guest card grows no broken badge (same class of lie as stock, D26). The guest who comes back still has `לא רכשתי, לשחרר את הפריט`.

## Non-goals

- Extension, bookmarklet, or an installed share target.
- A model writing title, price, or variant. The read is the shop's product data, then the couple.
- Stock, scarcity, auto-translate, image upload, and a variant control that rewrites the URL.
- Saving a collection, home, cart, or search URL on a known chain.
- A guest-facing dead-link state.
- English UI (D6).

## Top 5 risks

1. **The URL lands in search.** Two fields on one screen. If the paste field is below the fold or inside a tab, the iPhone paste hits the Hebrew box and the URL breaks visually. It has to be the first thing on C3.
2. **They confirm a card they never opened.** `לראות באתר` is easy to skip, and G4 will open whatever was stored. On this card that link sits above the pink button.
3. **An edited title invents a variant.** `מידה 0-3` typed onto a parent URL still opens every size. The variant line stays visible while the title is focused.
4. **Timeout feels like paste is broken.** The manual fields have to occupy the skeleton's place, with `לנסות שוב` in that same block, or they will leave.
5. **A 404 after a guest has held the item.** Replacing the URL changes the gift under them. Leaving it sends the next `להמשיך לאתר` to a dead page. C4 cannot change the URL today. The split is question 4.

## Open questions for the human

1. **Unknown chain — what fills the card?** (a) Manual fields only: URL kept, title empty, no preview. (b) If title and image come back inside the same wait, show the editable guest card, no chain chip, with `תבדקו לפני השמירה`. (c) A model fills title and price, same label, still not auto-saved. Recommendation: (a). (b) is fast and often the wrong variant's price; (c) is slow and wrong without looking wrong.

2. **No variant in the URL.** (a) Save the parent URL and show `בלי מידה או צבע — האורח יבחר באתר.` (b) Require a size or color chip, and store that variant's URL. (c) Refuse until the pasted URL already contains the variant. Recommendation: (a). Share-sheet Copy usually omits the variant. (b) fails closed when the option list is incomplete.

3. **They paste an item already on the list.** (a) Exact stored URL: `הפריט כבר ברשימה`, open it, no second row. (b) Same, plus `להוסיף עוד יחידה` to bump quantity. (c) A second row. Recommendation: (a). Quantity already lives on C4; a bump here hides a held item behind a counter.

4. **The guest later opens a dead product URL.** (a) The URL stays frozen. They release with `לא רכשתי, לשחרר את הפריט`; the couple paste a new item. (b) The couple may replace the URL on C4 only while nothing is held or funded. (c) The couple may replace it even with a hold, and the next handoff uses the new URL. Recommendation: (b). (a) cannot repair a typo found before anyone reserves. (c) swaps the gift under a guest who already took it.
