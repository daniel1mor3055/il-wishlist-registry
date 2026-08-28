# Frontend brief

Angle: the Figma Make to Next.js port. `C1`-`C6` are implementation checkpoints; PRD guest screens are cited as `G1`-`G10`.

## Goals

1. **Faithful output, discarded scaffolding.** Match the render pixel for pixel at 390px, and throw away the device mockup, the inline palette and the physical positioning that got it there.
2. **One place where a colour can be defined.** The reference's `C` object is how palette drift starts. No hex literal survives outside `globals.css`.
3. **RTL correctness that is checkable line by line** against PRD section 8, because PRD risk 5 is that a mirrored-but-wrong screen looks fine and gets approved.
4. **A server-rendered public page**, since the whole reason Next.js was chosen is a real Open Graph card for the WhatsApp share.
5. **All nineteen PRD section 7 states visible in one place**, so none is quietly skipped.

## Must-haves for the POC

### File structure

```
apps/web/src/
  app/
    layout.tsx                    lang="he" dir="rtl", Heebo via next/font
    globals.css                   @theme tokens, .ltr-token, sheet/toast keyframes
    r/[slug]/page.tsx             public registry, server component
    r/[slug]/not-found.tsx        G10
    (editor)/editor/...           couple editor, from C4
    dev/states/page.tsx           the state gallery, non-production only
    dev/og/page.tsx               the Open Graph preview harness
    bff/...                       route handlers proxying guest writes
  components/
    primitives/                   Price ShopChip PriorityBadge Meter Pill
                                  PrimaryButton SecondaryButton AmountChips ItemImage
    registry/                     Hero HowItWorks ProgressStrip ReassuranceStrip
                                  FilterChips ItemGrid ProductCard MoneyCard EnvelopeArt
                                  RegistryClient  <- the single client boundary
    sheets/                       SheetShell Modal BackButton CloseButton
                                  ItemDetailSheet HandoffSheet ReportModal
                                  GroupGiftSheet CashVoucherSheet ContactRevealSheet
                                  BlessingSheet ConfirmedSheet TakenSheet
    feedback/                     Toast ToastProvider
  lib/
    api.ts  types.ts  copy.ts  money.ts  fixtures/
```

`primitives/` are genuinely reusable and used by both the guest page and the editor. `registry/` are one-off sections. `sheets/` all share `SheetShell`, which is the reference's `Sheet` with the grabber and close-affordance layout fixed.

`copy.ts` is the single Hebrew string table, keyed to PRD section 7 rows and the API error codes. Strings do not live inline in components, because PRD section 8 has to be checkable against the spec and because the API returns codes rather than Hebrew.

### Server versus client boundary

| Layer | Kind | Responsibility |
|---|---|---|
| `r/[slug]/page.tsx` | server | fetch `PublicRegistry`, render `Hero`, `HowItWorks`, `ProgressStrip`, `ReassuranceStrip`, and the lifecycle shells for draft, closed and not-found |
| `generateMetadata` | server | the Open Graph card. Shares one memoised fetch with the page |
| `RegistryClient` | client, one boundary | filter state, the `SheetState` machine, toasts, optimistic reserve and its rollback, and all guest writes through `/bff/*` |
| Everything in `sheets/` | client | children of `RegistryClient` |
| `primitives/`, `ProductCard`, `MoneyCard` | server-compatible, no directive | pure presentational, rendered inside either tree |

What crosses the boundary: the whole serialised `PublicRegistry`, already privacy-filtered server-side. The client never fetches the registry read, never learns the API origin, and never receives a giver name or a per-guest amount.

One client boundary rather than several islands, deliberately: the reference's nine sheets are driven by a single `SheetState` union that any card can set, so splitting it into islands would mean lifting that state into a context and gaining nothing. The cost is that `RegistryClient` must stay a coordinator — state and handlers only, no markup beyond composition — or it becomes a god component by C3.

### Routing

| Route | Purpose |
|---|---|
| `/r/[slug]` | the public registry. `noindex` via `robots` metadata |
| `/editor` | editor home; the session cookie identifies the couple, so no id in the URL |
| `/editor/items/[id]`, `/editor/funds`, `/editor/share`, `/editor/tracker`, `/editor/settings` | PRD `ed-C2` through `ed-C10` |
| `/auth/callback` | a route handler, not a page. Exchanges the magic token, sets the session cookie, redirects |
| `/dev/states`, `/dev/og` | development only, 404 when `APP_ENV === 'production'` |

The magic-link session is an `HttpOnly` cookie set by the Next route handler, per the architect brief. Nothing about the session appears in a URL after the callback redirect, so a shared editor URL is useless to a stranger.

### Design tokens

`@theme` in `globals.css` as the single source, with SVGs using `currentColor` driven by Tailwind text utilities. No TypeScript mirror of the palette.

| PRD token | `@theme` variable | Utility |
|---|---|---|
| Background `#FDFCFA` | `--color-bg` | `bg-bg` |
| Surface `#FFFFFF` | `--color-surface` | `bg-surface` |
| Ink `#1F1D1B` | `--color-ink` | `text-ink` |
| Ink muted `#6B6560` | `--color-ink-muted` | `text-ink-muted` |
| Primary `#2F6F62` | `--color-primary` | `bg-primary` |
| Accent `#E5A24B` | `--color-accent` | `bg-accent` |
| Success `#3E7D55` | `--color-success` | `text-success` |
| Muted `#9A938C` | `--color-muted` | `text-muted` |
| Border `#E8E3DC` | `--color-border` | `border-border` |

Radius, spacing and the type scale follow the same route: `--radius-card: 16px`, `--radius-btn: 12px`, and PRD section 9's H1 28 / H2 22 / H3 18 / body 16 / small 14 as named text utilities rather than the reference's `text-[28px]` arbitrary values. A grep for `#` in `components/` returning nothing is the check.

The reference's remaining inline-style holdouts — the SVG `stroke={C.ink}` and `fill={C.amber}` attributes — become `currentColor` plus a text utility on the wrapping element. That is what removes the last reason for a TS palette object to exist.

### RTL: what must not be ported verbatim

Six things in the reference are wrong, brittle, or right-by-accident. This table is the C1 review checklist.

| Reference | Problem | Port as |
|---|---|---|
| `direction: rtl` inline on a nested div | not the document direction, so logical properties, form controls, scrollbars and the browser's own bidi handling all behave as LTR | `<html lang="he" dir="rtl">` in `layout.tsx` |
| `Meter`: `absolute inset-y-0 right-0` | right-by-accident. It is correct only because RTL happens to make right the inline start; it silently breaks the day anything renders LTR | `start-0` with `inset-block-0`, filling from the inline start. PRD section 8 requires meters flush to the right edge in RTL, which `start-0` expresses correctly |
| `CloseButton` renders a right-pointing chevron but is labelled `aria-label="סגירה"` (close) | it is a *back* affordance wearing a close label. A screen reader announces the wrong action | two components. `BackButton` keeps the right-pointing chevron per PRD section 8. `CloseButton` is an X with `aria-label="סגירה"` |
| Sheet grabber `mx-auto -translate-x-4` | a magic offset compensating for the button's width, so it drifts if the button size ever changes | a three-column grid row with the grabber `justify-self-center`, no translate |
| Toast close button `order-first` | in an RTL flex row the main axis runs right to left, so `order-first` places it on the **right**. PRD section 8 requires the close affordance on the left. Still live at `6967bdb` | drop `order-first` and put the text span first in the DOM, so the button lands last and therefore leftmost |
| `ProductCard` badges `absolute right-2 top-2`, badge rows `justify-end` | physical properties. `justify-end` resolves to the visual **left** in RTL, which is not where the reference wants chain and priority chips | `top-2 start-2` for badges, `justify-start` for the chip rows |

Also, `(1 - 550/1290) * 100` and `(1 - 1200/3000) * 100` are hardcoded in `ProductCard` and `MoneyCard`. They become a `money.ts` helper over the item's real remaining and total, or the meters will lie the moment the data is live at C2.

### The phone frame

Drop it from the app. Rebuild it as a dev-only wrapper in `/dev/states`.

The reference's 390x844 box, grey page background, fake iOS status bar with fake 9:41 and fake battery, and home indicator are how Figma Make presents a mobile design. Shipping them means `/r/[slug]` is a mockup of a website rather than a website, and every later responsive decision fights the frame.

The tradeoff is real, because the C1 gate is literally "does it look like the Make render". Resolution: `/dev/states` renders each state inside a 390x844 frame, which gives a true side-by-side against the render for the gate, while `/r/[slug]` is a real responsive page that happens to be identical inside a 390px viewport. PRD section 9's desktop rule — same content centred at max 1120px — is a C6 concern, not a C1 one.

### Images

Vendor them. Download the eight reference images once into `apps/web/public/seed/`, reference them by path, and let the seed's `image_path` point at those files.

Unsplash hotlinking breaks offline development, is rate-limited, is against their terms for anything durable, and means a demo depends on someone else's CDN. It also makes the PRD's broken-image state untestable, because images always load until the day they do not.

`ItemImage` wraps `next/image` with a 1:1 aspect ratio, a reserved box so there is no layout shift, and an `onError` fallback to the PRD's branded placeholder: category glyph plus the product name, never a grey box, never alt text on its own. That fallback needs the item's category, so **`category` must be present on the public item payload** — a contract requirement for the architect and domain seats.

### Fonts

`next/font/google`'s `Heebo` with `subsets: ['hebrew', 'latin']`, `display: 'swap'`, applied as a variable on `<html>`.

This matters more than usual for a Hebrew-first product. The reference's CSS `@import` is a render-blocking third-party request, and the fallback chain `system-ui, sans-serif` has materially different metrics for Hebrew glyphs. The card titles use a two-line clamp with a reserved `min-h-[48px]`, so a font swap with different metrics shifts every card in the grid. Self-hosting at build time with a matched fallback removes both the request and the shift.

### The state inventory

Build `/dev/states` at C1, not C6.

It enumerates all nineteen PRD section 7 rows as named entries backed by typed fixtures, each labelled with its PRD row and its exact Hebrew string, each rendered inside the 390x844 frame. It is simultaneously the C1 comparison surface, the review checklist for every later checkpoint, and the place a missing state is visible as a hole rather than as an omission nobody noticed. It is also the only practical way to review states that are hard to reach through the live UI, such as the reserve race or the offline row.

Fixtures are typed as the API's `PublicRegistry` and `PublicItem` from the start, per the architect brief, so C2 replaces a loader rather than a data model.

## Non-goals

- No component library, no Radix, no shadcn, no headless UI kit. The reference is nine sheets over one shell; a library is more integration work than the components cost.
- No animation library. The three keyframes in `index.css` port as-is.
- No dark mode, no theme switching, no English UI, no i18n framework (D6). One language, one direction, strings in `copy.ts`.
- No client data-fetching library. Server components plus route handlers.
- No storybook. `/dev/states` is the same idea at a fraction of the setup.
- No desktop layout work before C6. Mobile-first at 390px, and PRD section 9's 1120px desktop grid comes later.
- No PWA, no offline caching beyond the PRD's inline retry row, no service worker.
- No public blessings surface anywhere in the component tree (D17).
- No card fields, payment sheets or order summaries — there is no component for them to live in (D11).

## Top 5 risks

1. **RTL wrong but plausible.** This is PRD risk 5 and it is the highest-probability failure in the port. Five of the six rows in the table above look correct in the render and are wrong in principle, and the toast bug is wrong in the render too and was not caught by eye. The mitigation is that the table is a literal checklist run against the C1 output, not a description.
2. **Tailwind v4's token pipeline is unfamiliar.** `@theme` in CSS replaced `tailwind.config.js`, and most available material still describes v3. A silently non-functional token setup means either an afternoon lost or, worse, a fallback to the reference's inline hex values, which reintroduces exactly the drift the token strategy exists to prevent. Prove one token round-trip before porting anything.
3. **`RegistryClient` becomes a god component.** Nine sheets, filter state, optimistic reserve with rollback, toasts, and six write paths all land in one client component. By C3 it is unreviewable unless the sheet state machine moves into a reducer in its own file and the write calls into a hook from the start.
4. **Fixture and API drift between C1 and C2.** C1's fixtures are hand-written from a brief, and the API is built afterwards. Any divergence surfaces as a confusing render bug at C2 rather than as a type error. Generating types from the FastAPI OpenAPI schema at C2 and deleting the hand-written ones is the fix, and it has to actually happen.
5. **The two-line clamp is font-dependent.** `min-h-[48px]` on the card title assumes Heebo's metrics at 15px with 1.5 line height. If the font fails to load, or the clamp height is chosen against a fallback, every card in the grid shifts and the grid looks broken in exactly the way PRD section 7's long-Hebrew-name row warns about.

## Open questions for the human

1. **The phone frame at C1.** (a) Drop it from the app, rebuild it in `/dev/states` for the side-by-side comparison, recommended. (b) Keep it as the app shell so `/r/[slug]` matches the render exactly, and remove it later. (c) Keep it behind a `?frame=1` query parameter.
2. **Design tokens.** (a) `@theme` variables only, SVGs on `currentColor`, recommended, one source of truth. (b) `@theme` plus a TypeScript mirror for values that must reach JS, which is two sources that can disagree. (c) Keep the reference's `C` object and inline styles, fastest to port and guarantees drift.
3. **Product images.** (a) Vendor the eight files into `public/seed/`, recommended. (b) Keep the Unsplash hotlinks for the POC. (c) Proxy them through the API so the seed owns them.
4. **How sheets are addressed.** (a) Local `SheetState` in `RegistryClient`, matching the reference, recommended for C1-C3. (b) Sheet state in the URL via `searchParams`, so the Android back button closes a sheet and a link can open one directly — a real mobile win, and nine sheets' worth of parameter plumbing. (c) Start with (a) and migrate to (b) at C6.
