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

Baby registry is the wedge; other occasions are parked. Design discovery is done; the POC is being built in approval-gated checkpoints. C1 (skeleton and guest registry), C2 (Postgres, seed, API read path), C3 (the double-buy core: reserve, self-report, release) and C4 (the money surface: contributions, contact reveal, private blessings) are in.

| Document                                                 | What it is                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| [docs/decisions.md](docs/decisions.md)                   | Decision log. Authoritative — everything else defers to it           |
| [docs/prd.md](docs/prd.md)                               | PRD and UX spec: surfaces, screens, states, RTL rules, design tokens |
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
apps/web/            Next.js (App Router, TS, Tailwind v4), Hebrew RTL — the guest registry and, later, the couple editor
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
```

`npm run seed` is also the reset: demo registry items are replaced wholesale, which drops every hold placed against them.

`npm run dev:bg` starts the same dev server detached, logging to `.logs/web-dev.log`, and `npm run dev:stop` stops it. It exists for scripted screenshot runs, which cannot block on a process that never exits.

| URL                                           | What                                        |
| --------------------------------------------- | ------------------------------------------- |
| http://localhost:3000                         | Dev index — links to every demo registry    |
| http://localhost:3000/r/noa-itai-k4m2xq8vp3wt | The main demo registry (נועה ואיתי)         |
| http://localhost:3000/dev/states              | State gallery — every PRD state on one page |
| http://localhost:8000/docs                    | API docs, and the public read endpoint      |
| http://localhost:8025                         | Mailpit, for magic links (C5)               |

Checks: `npm run typecheck`, `npm run lint`, `npm run format`. API tests: `docker compose exec api pytest`. `npm run shoot` drives headless Chrome through the guest flow and writes a PNG per state, including a real lost race staged against a live page.

Regenerating seed data (rarely needed — both files are committed):

```bash
npm run harvest          # re-scrape the four chains into services/api/seed/
npm run demo-data        # recompose the five demo registries from the snapshot
npm run seed             # load both into Postgres
```

## Status

C4 done: the money surface, which completes the guest side. Every guest flow now writes — a group-gift or envelope contribution recorded at "שלחתי" (D38), the couple's Bit handle revealed by its own request and never in the page payload (D13), and a private blessing that carries the guest's name to the gift it came with (D17, D40). The reserve path from C3 is unchanged: one conditional `UPDATE ... WHERE quantity_claimed < quantity_wanted RETURNING`, so two guests on the last unit get one `201` and one `409` rather than an oversold gift.

Both counters are guarded by concurrency tests that were checked by regression rather than by inspection: a read-then-write reserve oversold a two-unit item to five guests, and a read-then-write contribution lost ₪410 of ₪940, while in both cases every sequential test still passed.

Next is C5, the couple's editor: magic-link identity, the create wizard, adding items from the harvested catalog, and item settings — the first surface where the couple, rather than a guest, writes.

## License

MIT
