# P2 — fixes for the current render

This reflects an actual review of the Figma Make output at `ILBabyRegistryFigmaMake/src/App.tsx`, generated from the enriched P1 prompt in [p1-enriched.md](p1-enriched.md). Run these three before adding any new screens (see [p3-missing-states.md](p3-missing-states.md)): fixing bugs first stops them from getting copied into the next batch of generated screens.

Paste **only** each fenced block, one at a time, in this order.

Do not send `prompts.md`'s original P2-P8 "funds sheet", "claimed-item state", or "partial quantity chip" prompts — the render already has all three (the cash envelope sheet, Card C, and Card D respectively). Sending them again risks Make building a second, slightly different version of a state that already exists.

---

## Bug 1 — handoff sheet names the wrong item

`App.tsx:692` hardcodes `"סימנו שהמוניטור שמור"` in the reserve/handoff sheet regardless of which item was tapped. Reserving Card A (the stroller) or Card D (the feeding set) still says "we noted the monitor is held."

```
Fix the reserve and handoff sheet: use the actual tapped item's name in the body text, not the hardcoded מוניטור reference.
```

**Check:** open the handoff sheet from Card A, D, and F (not just E) and confirm each one names the correct item.

---

## Bug 2 — toast close button on the wrong side

`App.tsx:631` uses `order-first` on the copy-confirmation toast's close button, trying to place it on the left. Inside an RTL flex row, the first-order item renders on the right, so the button lands exactly opposite of what was asked for. This is the "mirrored but wrong" RTL failure mode called out in the PRD.

```
Move the copy-confirmation toast's close button to the left edge. It currently sits on the right in RTL.
```

**Check:** trigger the toast from the contact-reveal screen's copy button and confirm the close X sits on the visual left.

---

## Bug 3 — empty note box on items without a note

`App.tsx:661` always renders a quote block for `it.note` in the item detail sheet, but only Card E (`מוניטור נשימה`) has a note defined. Opening the sheet from Card A, D, or F shows an empty pair of curly quotes.

```
In the item detail sheet, hide the couple's note block entirely for items that have no note, instead of showing empty quotes.
```

**Check:** open the detail sheet from Card A and D and confirm no empty quote box appears.
