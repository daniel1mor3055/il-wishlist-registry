# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A B2B2C baby gift registry for Israeli retailers (Babylist-style), Hebrew/RTL, mobile-first. It is a **coordination layer, not a commerce layer**: there is no checkout and the product never holds, routes, or escrows money (D11). Guests buy at the shop's own site or send cash directly to the couple via Bit/PayBox and self-report; the registry's job is to prevent double-buying and to track who gave what.

`docs/decisions.md` is the authoritative decision log (D1–D57) — when in doubt about *why* something is built a certain way, or whether a behavior is intentional, check there before changing it. `docs/prd.md` has the UX spec (screens, states, RTL rules, design tokens). `docs/testing.md` explains the test layers and how to add a spec as a checkpoint lands.

Development proceeds in approval-gated checkpoints (C1–C8 shipped; the next work is an unranked backlog). Do not silently redesign locked behavior — `docs/decisions.md` decisions marked `LOCKED` are load-bearing; if a change conflicts with one, surface that instead of overriding it silently.

## Commands

Backing services (Postgres, Mailpit, API) run in Docker; the Next.js dev server runs on the host (containerized `next dev` file watching is too slow on macOS).

```bash
cp .env.example .env
npm install
npm run services:up      # postgres :5433, mailpit :8025, api :8000 (migrates on start)
npm run seed             # loads harvested catalog + 5 demo registries; also the reset (idempotent)
npm run dev              # next dev on :3000
```

Checks:

```bash
npm run typecheck        # web app types
npm run test:api         # pytest inside the api container, requires services:up
npm run test             # typecheck + test:api — the loop while iterating
npm run test:e2e         # Playwright guest/editor screens, requires dev app + seed + services up
npm run test:all         # everything — run before calling a checkpoint done
npm run lint
```

CI runs on GitHub Actions. Import-linter contracts live in `services/api/pyproject.toml`.

Single test:

```bash
docker compose exec -T api pytest services/api/tests/test_reserve.py -k some_test_name
npx playwright test e2e/c3-guest-hold.spec.mjs
```

Other:

```bash
npm run dev:bg / dev:stop   # detached dev server + log at .logs/web-dev.log, for scripted screenshot runs
npm run shoot               # screenshot driver — for visual review, not assertions
npm run harvest             # re-scrape the 4 chains into services/api/seed/ (rarely needed, snapshot is committed)
npm run demo-data           # recompose the 5 demo registries from the snapshot
npm run migrate             # alembic upgrade head inside the api container
```

Opening http://localhost:3000 redirects to the editor; ask for a magic link with your own email and open it from Mailpit (http://localhost:8025). Any address creates a new couple, and `noa.itai@example.com` still opens the seeded fixture list, which exists for the test suite (D57), not as a product entry.

## Architecture

```
apps/web/            Next.js App Router, TS, Tailwind v4, Hebrew RTL
services/api/        FastAPI + SQLAlchemy + Alembic, modules: registry, catalog, gifting, identity
services/api/seed/   catalog_snapshot.json (real harvested products) + demo_registries.json
tools/               harvest_catalog.py, build_demo_registries.mjs
e2e/                 Playwright specs, one file per checkpoint
```

The web app holds no data of its own — every guest page is server-rendered from `GET /api/v1/public/registries/{slug}`.

**Two deliberately different write patterns exist (D47), and this is the one place the codebase does this on purpose:**

- **Guest surface (`/r/{slug}`)** writes through client components with optimistic state, calling route handlers under `apps/web/src/app/bff/`. The browser never learns the API origin. The guest identity is an `HttpOnly` per-registry cookie minted by the `/bff` handler and forwarded to the API as `X-Guest-Id` (D31) — there is no `guests` table, the cookie value *is* the guest.
  ```
  POST   /bff/registries/{slug}/items/{itemId}/reservations
  POST   /bff/registries/{slug}/reservations/{id}/report
  DELETE /bff/registries/{slug}/reservations/{id}
  POST   /bff/registries/{slug}/items/{itemId}/contributions
  POST   /bff/registries/{slug}/blessings
  GET    /bff/registries/{slug}/payment-handle       (D13/D41 reveal, on interaction only)
  GET    /bff/registries/{slug}/shipping-address      (D49 reveal, on interaction only)
  ```
- **Editor surface (`/editor`)** is forms and navigation, so it reads the API from the server and writes through server actions instead. Session identity follows the same cookie/header split as the guest id (D42): an opaque token from `POST /auth/session` is stored `HttpOnly` on the web origin and forwarded as `X-Session-Token`. `/editor/session` is the one route-handler exception, because setting a cookie requires one.

`services/api/app` is modularized by domain (`registry`, `catalog`, `gifting`, `identity`), each with `models.py` / `schemas.py` / `service.py` / `router.py`. `registry` splits guest-facing (`router.py`) from owner-facing (`owner_router.py`, `owner_service.py`, `owner_schemas.py`).

### Load-bearing invariants (don't casually refactor around these)

- **Reserve is one conditional `UPDATE ... WHERE quantity_claimed < quantity_wanted RETURNING`**, not read-then-write — a read-then-write oversold a 2-unit item to 5 guests under concurrency. Same story for the contribution counter (compute the new total in SQL against the locked row, not in Python) — a read-then-write lost ₪410 of ₪940. Both are guarded by dedicated race tests (`test_reserve_race.py`, `test_contribute_race.py`) that commit for real rather than rolling back; don't trim them, they're the only thing that catches an oversell.
- **The couple may not edit away a guest's action (D45)**: quantity can't drop below what's already claimed, group gifting can't be switched off once contributions exist, and an item with history is deactivated rather than deleted. The API enforces this itself, not just the editor UI.
- **Ownership is a query filter, not an ID comparison** — `/me/registry` and related owner routes carry no ID, so someone else's item and a made-up ID both 404 identically (D44).
- **A registry's payment handle has exactly one route, and it's a `GET`** (D41) — `test_health.py` asserts nothing else exposes it, since a `POST` there would be a first step toward money custody, which this product never does (D11).
- **Unpublished registries 404 like a wrong slug (D30)** — there is no "not published yet" state visible to guests.
- Idempotency for guest writes is a unique DB column (e.g. `Idempotency-Key` unique on `reservations`), not a generic idempotency-key store (D32).
- **The tracker is a gifting read (D52)** — `GET /me/registry/gifts` lists held and purchased reservations and contributions; released reservations are omitted and the guest cookie id never leaves the API. `GET /me/registry` still hides giver data.
- **Couple corrections, and every reservation transition is conditional (D53)** — the couple may move held to released, held to purchased, and purchased to released. Every reservation change, guest or couple, is a conditional `UPDATE` on the current state, and the counter moves only when that `UPDATE` returned a row. `resolved_by` is `guest` or `couple`. `test_couple_release_race.py` commits for real, on quantity 2.
- **Contributions are immutable (D54)** — the couple sees what guests reported. There is no void, edit or delete.
- **No thank-you feature (D55)** — no `thanked_at`, no composer, no thanks column and no waiting-for-thanks filter.
- **Closing is reversible (D56)** — `POST /me/registry/close` stamps `closed_at` on a published list and keeps the first stamp; `POST /me/registry/reopen` clears it. A closed list still refuses new holds and money and still accepts reports, blessings and the couple's corrections (D34).
- **Demo registries carry a ledger that reconciles (D57)** — every claimed unit has a reservation row and every contributed agora a contribution row. The demo composer derives the counters from the ledger; `test_seed_ledger.py` runs the seed and reconciles them.

## Testing

Three independent layers (`docs/testing.md`), none a substitute for the others:

| Layer | Command | Catches |
|---|---|---|
| Types | `npm run typecheck` | Web app stops typechecking |
| API | `npm run test:api` | Bad guest write, wrong public payload shape, a race, a wrong 404 |
| Guest e2e | `npm run test:e2e` | Wrong Hebrew copy, a hold that looks like someone else's, a reveal that never arrives |

API tests live in `services/api/tests/`, one pytest module per product surface, run inside the API container against real Postgres; each test rolls back except the three race files. **Do not put Hebrew in API tests** — the API returns codes, the web owns words.

e2e specs live in `e2e/`, one file per checkpoint (`cN-*.spec.mjs`), seed the demo registries first, and assert Hebrew copy / `data-testid` / roles — not CSS classes. Specs that write (holds, new couples, ledger corrections) run serial.

When you lock a new decision in `docs/decisions.md`, add or extend the test that would have failed before the lock, and name the decision ID in the test/spec so the next reader knows why the assertion exists. Don't add a pending/skipped spec for something not built yet — add the spec in the same change that ships the behavior.

`npm run shoot` (screenshots) is for visual review only, not assertions — a drifted screenshot is a review item, not a failing test.
