# P3 — states missing from the current render

Cross-checked against the state inventory in [../prd.md](../prd.md) section 7, and against `ILBabyRegistryFigmaMake/src/App.tsx`. Run [p2-render-fixes.md](p2-render-fixes.md) first. Paste **only** each fenced block, one at a time.

Already present in the render, so not listed below: the cash/voucher sheet, the claimed-item state (Card C, badge `כבר נתפס`), and the partial-quantity chip (Card D, `נשארו 2 מתוך 4`). These three still appear as separate follow-ups in `prompts.md`'s original P2-P8 list, written before the render existed — skip them, they are redundant now.

---

## Removals first

D27 and D28 dropped two things the render already has. Send these before adding states, so the new screens are not generated with them baked in.

```
Remove the priority badges ("חובה", "רצוי", "נחמד שיהיה") from every card and every sheet.
```

```
Rename the "קופה לעגלה" card to "חיבוק בביט / פייבוקס 💛" with the subtitle "כל סכום, ישירות אלינו", and delete its target amount and funding meter, so it is a plain cash envelope with amount chips only.
```

## Required states

```
Add an empty-registry state: no grid, one warm card reading "נועה ואיתי עוד מכינים את הרשימה".
```

```
Add a completed group gift state: meter full, button disabled, text "המתנה הושלמה. תודה לכל מי שהשתתף".
```

```
Add an error screen: "הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו".
```

## Optional extras, if the above land cleanly

```
Add a single-item state: one full-width hero card instead of a two-column grid.
```

```
Add a fully-claimed banner above the grid: "כל הפריטים ברשימה נתפסו. אפשר עוד לתת שי".
```

```
Add a broken-image placeholder: branded square with a category glyph, never a grey box.
```

```
Give card H, the gift voucher, its own icon distinct from card G's envelope, so cash and vouchers read as different instruments.
```

---

## After this batch

Once these land and pass the RTL/checkout checks in `prompts.md`'s "What to look for when reviewing output" section, move on to `prompts.md`'s P9 (couple editor), P14 (retailer widget), and P15 (desktop pass) — none of those are affected by this file.
