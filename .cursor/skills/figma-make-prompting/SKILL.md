---
name: figma-make-prompting
description: Writes paste-ready Figma Make prompts for the Israeli baby registry project, including Hebrew RTL constraints and single-change follow-ups. Use when producing or revising Figma Make prompts, iterating on generated visuals, or when the user asks for a Make prompt.
disable-model-invocation: true
---

# Figma Make prompting

The agent never drives Figma. It writes prompt text the human pastes into Figma Make. No Figma plugin, no Figma MCP, no component library wrangling.

## Prompt pack shape

| Artifact | Length | Purpose |
|---|---|---|
| Master prompt | 150-250 words plus a constraints block | Establishes product, user, screen order, tokens, RTL, states |
| Screen prompts | one per surface | Added in sequence, never all at once |
| Follow-ups | 5-25 words each | Exactly one change per prompt |

## Master prompt must contain all five

1. **What** - the product type, specifically. Not "a registry app".
2. **Who** - the user of that screen, and their emotional state.
3. **Structure** - sections in order, top to bottom. Make follows a stated order far more reliably than one it invents.
4. **Style** - a named reference plus concrete values: hex codes, font names, radius, spacing.
5. **Interactions and states** - what is clickable, and which non-happy states must be visible on the canvas.

## Hebrew RTL constraints block

Append verbatim to the master prompt and to any prompt that creates a new screen:

```
כל הממשק בעברית בלבד, כיוון RTL מלא.
Direction is right-to-left: navigation, icons, progress bars, and card layouts all mirror.
Do not include any English UI text, placeholder lorem ipsum, or Latin dummy names.
Use realistic Israeli names, shekel prices formatted as ₪1,234, and Israeli retailer names.
Font: Heebo or Rubik. Numerals stay Western Arabic (1234), not Hebrew numerals.
```

## Iteration rules

- One change per follow-up. Multi-change follow-ups produce muddled output.
- Ask for states explicitly; Make defaults to the happy path and to full lists.
- When Make drifts off the palette, do not nudge - command it to re-read its own tokens and regenerate using only those values.
- Never paste the whole PRD into Make. Paste the screen's slice.

## Anti-patterns

- Abstract style words with no values ("modern", "clean") - they produce generic output.
- Asking for three surfaces in one prompt.
- Letting Make invent copy. Supply the Hebrew strings for anything that carries product meaning.
- Accepting the first render as the design. First prompt lands roughly 60-70 percent; the structure is right long before the detail is.
