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

Baby registry is the wedge; other occasions are parked. Design discovery is done; the POC is being built in approval-gated checkpoints. C1 (skeleton and guest registry) and C2 (Postgres, seed, API read path) are in.

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

`npm run dev:bg` starts the same dev server detached, logging to `.logs/web-dev.log`, and `npm run dev:stop` stops it. It exists for scripted screenshot runs, which cannot block on a process that never exits.

| URL                                           | What                                        |
| --------------------------------------------- | ------------------------------------------- |
| http://localhost:3000                         | Dev index — links to every demo registry    |
| http://localhost:3000/r/noa-itai-k4m2xq8vp3wt | The main demo registry (נועה ואיתי)         |
| http://localhost:3000/dev/states              | State gallery — every PRD state on one page |
| http://localhost:8000/docs                    | API docs, and the public read endpoint      |
| http://localhost:8025                         | Mailpit, for magic links (C4)               |

Checks: `npm run typecheck`, `npm run lint`, `npm run format`. API tests: `docker compose exec api pytest`.

Regenerating seed data (rarely needed — both files are committed):

```bash
npm run harvest          # re-scrape the four chains into services/api/seed/
npm run demo-data        # recompose the five demo registries from the snapshot
npm run seed             # load both into Postgres
```

## Status

C2 done: Postgres schema and Alembic migrations, an idempotent seed from the harvest, the public read endpoint, and the guest registry reading through it — the TypeScript fixtures are gone. Next is C3, the guest write loop: reserve, self-report, contribute, blessing, and the race and idempotency tests that go with them.

## License

MIT
