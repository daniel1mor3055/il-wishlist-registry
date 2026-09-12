# il-wishlist-registry

Wishlist and gift registry platform for Israeli retailers — Amazon-style lists for shops that don't offer them natively.

## Problem

Major e-commerce platforms (Amazon, Target, etc.) offer wishlists and baby/wedding registries that drive repeat visits, social sharing, and higher conversion. Most Israeli online shops lack this capability, leaving a gap for both consumers and retailers.

## Vision

A B2B2C platform that Israeli retailers can embed or integrate, giving their customers:

- **Personal wishlists** — save items, share with friends and family
- **Gift registries** — baby, wedding, birthday, and custom event lists
- **Social sharing** — WhatsApp-friendly links, QR codes, privacy controls
- **Purchase coordination** — mark items as purchased to avoid duplicates (registry mode)

## Target users

| Segment     | Need                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Shoppers    | Create lists, share with gift-givers, track what's been bought         |
| Retailers   | Increase engagement, AOV, and repeat traffic without building in-house |
| Gift-givers | Browse a curated list, buy confidently, avoid duplicate gifts          |

## Current phase

Baby registry is the wedge; other occasions are parked. Design discovery is done; the POC is being built in approval-gated checkpoints. C1 (skeleton and guest registry), C2 (Postgres, seed, API read path), C3 (the double-buy core: reserve, self-report, release), C4 (the money surface: contributions, contact reveal, private blessings) and C5 (the couple's editor: magic-link login, create wizard, catalog search, item settings, publish) are in.

| Document                                                 | What it is                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| [docs/decisions.md](docs/decisions.md)                   | Decision log. Authoritative — everything else defers to it           |
| [docs/prd.md](docs/prd.md)                               | PRD and UX spec: surfaces, screens, states, RTL rules, design tokens |
| [docs/testing.md](docs/testing.md)                       | Test layers and how to add a spec as a checkpoint lands              |
| [docs/figma-make/prompts.md](docs/figma-make/prompts.md) | Paste-ready Figma Make prompt pack                                   |
| [docs/council/](docs/council/)                           | Adversarial discovery and implementation briefs, with consolidations |

Shape of the product as currently locked:

- Hebrew only, RTL, mobile-first. No English UI in this phase.
- Guests never create an account. Optional name and private message.
- **No money custody, ever.** There is no checkout in this product. Guests buy at the shop's own site or send money directly to the couple via Bit/PayBox, then self-report. We coordinate; we do not transact.
- Reservation state is public so nobody double-buys; giver identity is visible only to the couple.
- The list is built pre-birth and published with the birth announcement.

## Repo layout

```
apps/web/            Next.js (App Router, TS, Tailwind v4), Hebrew RTL — /r/{slug} for guests, /editor for the couple
services/api/        FastAPI + SQLAlchemy, modules: registry, catalog, gifting, identity
services/api/migrations/  Alembic
services/api/seed/   catalog_snapshot.json (180 real products from four chains) and demo_registries.json
tools/               harvest_catalog.py (catalog harvester), build_demo_registries.mjs (demo composer)
docs/                decisions, PRD, Figma Make prompts, council briefs
```

## Running it locally

Backing services run in Docker; the web app runs on the host, because containerised `next dev` file watching on macOS is slow enough to hurt.

```bash
cp .env.example .env
npm install
npm run services:up      # postgres :5433, mailpit :8025, api :8000 (migrates on start)
npm run seed             # harvested catalog + the five demo registries, idempotent
npm run dev              # next dev on :3000
```

The web app has no data of its own: every page is server-rendered from `GET /api/v1/public/registries/{slug}`, so the API and a seeded database have to be up.

Guest writes go the same way round, through route handlers under `/bff` — the browser never learns the API origin, and the guest cookie is set on the web origin, `HttpOnly`, one per registry:

```
POST   /bff/registries/{slug}/items/{itemId}/reservations    take one unit
POST   /bff/registries/{slug}/reservations/{id}/report       "כן, רכשתי" or "לא רכשתי" (D12, D35)
DELETE /bff/registries/{slug}/reservations/{id}              hand the unit back
POST   /bff/registries/{slug}/items/{itemId}/contributions   record money the guest says they sent
POST   /bff/registries/{slug}/blessings                      private message plus the guest's name
GET    /bff/registries/{slug}/payment-handle                 the D13 reveal, on interaction only
GET    /bff/registries/{slug}/shipping-address               the D49 reveal, on interaction only
```

The couple's side works the other way round: `/editor` pages read the API from the server and write through server actions, because the editor is forms and navigation rather than optimistic client state (D47). Same cookie split as the guest id — the session token is `HttpOnly` on the web origin and travels to the API as `X-Session-Token` (D42).

```
/editor/enter      ask for a magic link
/editor/session    where the link lands: spends the token, sets the cookie, redirects
/editor/new        the three-step create wizard
/editor            the list, the publish banner, the link to share
/editor/add        search the harvested catalog, or add something by hand
/editor/items/{id} quantity, note, group gifting, remove
/editor/address    the street guests copy at the shop (D49)
```

To sign in to the seeded demo list, ask for a link as `noa.itai@example.com` and open it from [Mailpit](http://localhost:8025). Any other address creates a new couple and lands in the wizard.

`npm run seed` is also the reset: demo registries are dropped and rebuilt, which drops every hold and contribution placed against them, and it clears the registries left behind by screenshot runs.

`npm run dev:bg` starts the same dev server detached, logging to `.logs/web-dev.log`, and `npm run dev:stop` stops it. It exists for scripted screenshot runs, which cannot block on a process that never exits.

| URL                                           | What                                          |
| --------------------------------------------- | --------------------------------------------- |
| http://localhost:3000                         | Dev index — links to every demo registry      |
| http://localhost:3000/r/noa-itai-k4m2xq8vp3wt | The main demo registry (נועה ואיתי)           |
| http://localhost:3000/editor                  | The couple's editor (magic link, no password) |
| http://localhost:3000/dev/states              | State gallery — every PRD state on one page   |
| http://localhost:8000/docs                    | API docs, guest and owner endpoints alike     |
| http://localhost:8025                         | Mailpit — where the magic links arrive        |

Checks: `npm run test` (types + API). Guest screens: `npm run test:e2e` (Playwright, needs the running app). The map of what belongs in which layer, and how to add a spec as a checkpoint lands, is [docs/testing.md](docs/testing.md). `npm run shoot` is still the screenshot driver — looking, not asserting.

Regenerating seed data (rarely needed — both files are committed):

```bash
npm run harvest          # re-scrape the four chains into services/api/seed/
npm run demo-data        # recompose the five demo registries from the snapshot
npm run seed             # load both into Postgres
```

## Status

C5 done: the couple can now build the list a guest buys from. A magic link mailed to Mailpit and exchanged for a session (D42, D43), a three-step wizard that seeds a starter list from the harvested catalog, search over that catalog, item settings, and one button that makes the link work (D48). Before it, every registry in the product came from the seed script.

The shipping address is the other half of the product handoff (D49): the couple may store a street during the wizard or later at `/editor/address`, and a guest leaving for the shop can copy it. The street is not in the public page; it is fetched only after they tap, the same split as the Bit number.

The rule the editor is built around is that the couple may not edit away a guest's action (D45): quantity will not drop below what is already held, group gifting will not switch off over real contributions, and an item with history is hidden from guests rather than deleted. Ownership is a query filter, not a comparison — `/me/registry` carries no id, so someone else's item and a made-up one are the same `404`.

Earlier checkpoints stand: the reserve path is one conditional `UPDATE ... WHERE quantity_claimed < quantity_wanted RETURNING`, and both it and the contribution counter are guarded by concurrency tests checked by regression rather than inspection — a read-then-write reserve oversold a two-unit item to five guests, and a read-then-write contribution lost ₪410 of ₪940, while every sequential test still passed.

Next is C6: the envelope and voucher settings, the payment handle the couple enters for D13, story and cover, preview-as-guest, and the share surface — WhatsApp message, link preview card, QR.

## License

MIT
