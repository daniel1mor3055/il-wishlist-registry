# Architect brief

Angle: module boundaries and contracts. `C1`-`C6` here are implementation checkpoints; the PRD's couple-editor screens are cited as `ed-C2`, `ed-C9`.

## Goals

1. **One API, two serialisations.** D8 and D15 are enforced by separate response models on the server, never by UI discipline. A guest payload physically cannot carry a giver name or a per-guest amount.
2. **Guest writes without accounts.** The slug is the only capability; holds are idempotent and race-safe from the first write, because self-reported state is all we have.
3. **Seams that survive a service split.** `catalog` is extractable first because it is the only module that will later talk to real shops.
4. **SSR reads that a WhatsApp crawler can actually fetch.** The public registry read is anonymous, server-rendered, and cookie-free.
5. **One error envelope, one Hebrew copy table.** The API returns codes; the web owns the strings, so they stay byte-identical to the PRD.

## Must-haves for the POC

### Endpoints

All API paths carry `/api/v1` except `/health`. `/public/**` is anonymous; `/me/**` requires a couple session. Guests never get a catalog endpoint.

| Method and path | Auth | Returns | CP |
|---|---|---|---|
| `GET /health` | none | `{status, version}` | C1 |
| `GET /public/registries/{slug}` | none | `PublicRegistry`: names, story, cover, lifecycle state, due date, claimed/total counts, `items[]` as `PublicItem`, funds | C2 |
| `GET /public/registries/{slug}/items/{id}` | none | one `PublicItem` plus handoff URL; re-read on sheet open to catch races | C2 |
| `POST /public/registries/{slug}/items/{id}/reservations` | guest cookie issued here | `{reservation_id, item}`; conditional insert, `409` on race | C3 |
| `POST /public/reservations/{id}/report` | guest cookie | body `{purchased, giver_name?}` → updated `PublicItem` (D12) | C3 |
| `DELETE /public/reservations/{id}` | guest cookie | guest releases own hold, `204` | C3 |
| `POST /public/registries/{slug}/contributions` | guest cookie | body `{target_type, target_id, amount, sent, giver_name?}` → `{remaining, total, contributor_count}` and nothing else | C3 |
| `POST /public/registries/{slug}/blessings` | guest cookie | `201`, empty body (D17) | C3 |
| `GET /public/registries/{slug}/payment-handle` | none, rate-limited | `{method, handle, display_name}`; never inside `PublicRegistry` (D13) | C3 |
| `POST /auth/magic-link` | none | `202` always, no account enumeration; mail lands in Mailpit | C4 |
| `POST /auth/session` | magic token | sets session cookie, `{couple_id, registry_id}` | C4 |
| `DELETE /auth/session` | session | `204` | C4 |
| `GET /me/registry` | session | `OwnerRegistry` with `OwnerItem[]` | C4 |
| `PATCH /me/registry` | session | story, cover, due date, payment handle, lifecycle transition | C4, C6 |
| `POST /me/registry/items`, `PATCH`/`DELETE /me/registry/items/{id}` | session | `OwnerItem` | C4 |
| `POST /me/registry/items/reorder` | session | `{ordered_ids[]}` → `204` (ed-C2 drag) | C5 |
| `POST /me/registry/funds`, `PATCH /me/registry/funds/{id}` | session | Bit/Paybox fund only (ed-C5) | C5 |
| `GET /me/registry/gifts` | session | tracker rows: item, giver name, amount, timestamp, status, blessing. The only place D15 amounts and D17 blessings exist | C5 |
| `POST /me/registry/gifts/{id}/release`, `/correct` | session | D16 controls → updated tracker row | C5 |
| `GET /catalog/search?q=&chain=&category=` | session | seeded mock cards through `CatalogPort` | C4 |
| `POST /catalog/resolve` | session | `{url}` → card or `catalog_unreadable` (ed-C3 paste tab; see O1) | C5 |

State-mutating guest endpoints are the four `POST`s and one `DELETE` above. They stay safe without accounts by: an unguessable slug (≥22 chars, `noindex`) as the sole capability; an `HttpOnly` guest cookie scoped to `/r/{slug}` issued on first write, which identifies a guest only to itself; `Idempotency-Key` on every guest `POST`, deduped by `(guest_token, target)`; a conditional `UPDATE ... WHERE remaining > 0 RETURNING` so a race returns `409` instead of over-claiming; per-IP and per-slug rate limits on reservations, contributions, blessings and the handle reveal; and no guest verb that touches a row the guest's token does not own.

### Guest versus couple serialisation

Two hand-written Pydantic models per entity, built by two serialiser functions. No shared model with `exclude`, no ORM object returned from a router. A golden-key test asserts the exact key set of `PublicRegistry` and `PublicItem`, so a new column cannot leak by default. This test lands in C2, before any UI reads the API.

| Field | Guest (`PublicItem`) | Couple (`OwnerItem`) |
|---|---|---|
| Name, image, price, chain, priority, couple note | yes | yes |
| Claim state (`available` / `reserved` / `purchased`), quantity remaining | yes (D8) | yes |
| Giver name | never | always (D7) |
| Per-contribution amount | never (D15) | always |
| Group gift / fund | `remaining`, `total`, `contributor_count` only | full contribution ledger |
| Blessing text | never, not even its own submission echoed back | always (D17) |
| Payment handle | only via the reveal endpoint, on interaction | in settings |
| Own reservation | only the one matching its cookie | all |

### Module boundaries

| Module | Owns | May call | Must never |
|---|---|---|---|
| `registry` | registries, items, ordering, slug, lifecycle | `catalog` via `CatalogPort`, `identity` for an owner id | import `gifting` models or tables |
| `catalog` | chains, seed cards, `CatalogPort`, URL patterns | nothing internal | know registries, items, guests or sessions; hold any FK into our tables |
| `gifting` | reservations, contributions, blessings, guest tokens, tracker projection | `registry` read port | write item rows outside `registry`'s service; call `catalog` |
| `identity` | couples, emails, magic tokens, sessions | nothing internal | know registry, gifting or catalog shapes |

Rules: cross-module traffic goes through `<module>/service.py` only; routers compose services and never reach across. Catalog output is **snapshotted** onto the item (`external_id`, `canonical_url`, `chain`, `title`, `image_url`, `price_at_add`), so no foreign key ever crosses into catalog. Enforce with `import-linter` in CI from C2. First extraction: `catalog` — swap the adapter behind `CatalogPort` for an HTTP client and nothing else moves.

### Web to API

| Caller | Base URL | Env |
|---|---|---|
| Next server components and route handlers | `http://api:8000` | `API_INTERNAL_URL`, server-only |
| Browser (recommended) | same-origin `/bff/*`, proxied by Next route handlers | none |
| Browser (fallback if the proxy is dropped) | `http://localhost:8000` | `NEXT_PUBLIC_API_BASE_URL` plus a CORS allowlist |

Recommendation: the browser never learns the API origin. All client mutations go to Next route handlers under `/bff/*`, which forward to `API_INTERNAL_URL` with the cookie attached. This makes every cookie first-party, kills the `SameSite=None` fight on localhost, and leaves exactly one public env var. One module, `lib/api.ts`, is the only file that reads either base URL.

Server components: the registry hero and grid, item detail initial data, `not found` / `draft` / `closed` shells, the couple editor's first paint, and `generateMetadata` for the Open Graph card. Client components: filter chips, the sheet and modal state machine ported from the Figma Make `SheetState` union, reserve and report and contribute and blessing writes, the copy button, toasts, and the optimistic reserve that must roll back on `409`.

### Auth propagation

Magic link points at Next: `/auth/callback?token=...` (a route handler, not a page). Next `POST`s the token to `/auth/session`, receives an opaque session token, and sets its own `HttpOnly`, `SameSite=Lax`, `Secure`-in-prod cookie. Every server-side fetch reads that cookie and forwards it as `Authorization: Bearer`. The token never reaches a client component, `localStorage`, a URL after the callback, or the bundle. Guest tokens use the identical pattern with a registry-scoped path.

### Config

| Var | Where | Note |
|---|---|---|
| `API_INTERNAL_URL` | web, server | `http://api:8000`; must never be prefixed `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | web, public | the only public var; absolute OG and canonical URLs |
| `SESSION_SECRET` | web, api | signs the session cookie |
| `DATABASE_URL` | api | Postgres DSN (from C2) |
| `SMTP_HOST`, `SMTP_PORT` | api | `mailpit:1025` (from C4) |
| `CORS_ORIGINS` | api | only if the `/bff` proxy is dropped |
| `APP_ENV`, `LOG_LEVEL` | both | |

Never in the web bundle: `DATABASE_URL`, `SESSION_SECRET`, SMTP settings, `API_INTERNAL_URL`, magic-link tokens, and any couple's payment handle. Structural guard: `env.server.ts` and `env.client.ts`, where a `"use client"` file may import only the latter.

### Error contract

```json
{ "error": { "code": "item_already_reserved", "detail": { "item_id": "b" }, "request_id": "..." } }
```

The API never returns user-facing Hebrew. The web maps `code` to copy, so strings stay identical to the PRD state inventory. Unknown codes fall through to the generic row.

| Code | HTTP | Hebrew | Surface |
|---|---|---|---|
| `registry_not_found` | 404 | `הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו` (not found, maybe the link was truncated) | G10 page |
| `registry_not_published` | 404, no contents | `הרשימה עדיין לא פורסמה` (not published yet) | G10 page |
| `registry_closed` | 200, read-only payload | `הרשימה נסגרה. תודה לכל מי שהשתתף` (closed, thank you) | G10 summary |
| `item_already_reserved` | 409 | `בזמן שמילאת, אורח אחר לקח את הפריט` (while you were filling this in, another guest took it) | G4 inline, roll back the optimistic hold |
| `fund_complete` | 409 | `המתנה הושלמה. תודה לכל מי שהשתתף` (the gift is complete) | G6 closed CTA |
| `validation_error` | 422 | per-field helper text, right-aligned, icon on the right of the field | forms |
| `rate_limited` | 429 | `רגע, ננסה שוב עוד מעט` (one moment, we will try again shortly) | toast |
| anything else, including network | — | `משהו נתקע. לנסות שוב?` (something got stuck, try again?) | inline retry row, G2 |

Toasts follow PRD section 8: text right-aligned, close affordance on the left. No English, no status code, and no `request_id` on screen.

### Checkpoint discipline

C1 is `apps/web` plus an API serving only `/health`: no schema, no Alembic, no auth, no `/bff` routes beyond a health probe. Its fixtures live in `apps/web/src/lib/fixtures/` and are **typed as `PublicRegistry` and `PublicItem`**, hand-written once from this brief, so C2 replaces a loader rather than a data model. From C2 the TS types are generated from the FastAPI OpenAPI schema and the fixtures survive only for visual-state tests.

## Non-goals

- No checkout, card field, payment sheet, PSP, or any endpoint that moves money (D11).
- No guest accounts, guest read of another guest's data, or guest-visible tracker.
- No public blessings endpoint or public guestbook (D17).
- No retailer widget endpoints, retailer auth, or attribution plumbing (D18).
- No live retailer reads in C1-C3; catalog is seed-only behind `CatalogPort` until O1 is answered.
- No real email delivery, password auth, OAuth, refresh tokens, or roles beyond couple-owns-registry.
- No service split, message bus, per-module database, Kubernetes, cloud, or CDN in the POC.
- No GraphQL, tRPC, client data-cache library beyond the App Router, i18n framework, sitemap, or SEO surface; lists stay unlisted behind a long random slug plus `noindex`.

## Top 5 risks

1. **Payload leak.** SSR puts the server response into the page source, so anything in the public read is scrapeable. A giver name or a payment handle that reaches `PublicRegistry` breaks D8, D13 and D15 at once, silently. The golden-key test and the reveal-on-demand endpoint are the only real defences.
2. **Two-base-URL and cookie origin.** `localhost` fetches fail inside the container and cross-origin cookies fail quietly. Both classes of bug appear late and look like UI bugs. Land `lib/api.ts` and the `/bff` proxy in C1, when only `/health` exists and the fix is free.
3. **The WhatsApp card depends on an anonymous read.** If the registry read ever needs a cookie, a client fetch, or a guest token, previews die and the highest-traffic surface degrades to a bare URL. Draft and closed registries must still return valid, non-error metadata.
4. **Guest write races and double submits.** No accounts means back-button re-`POST`s, double taps and two guests on one item are all normal traffic. Idempotency keys and conditional updates belong in C3 with the first write, not in C6 hardening.
5. **Seam erosion.** FastAPI's dependency injection makes a cross-module ORM import a one-liner, and the first foreign key from an item into a catalog row makes the catalog extraction a migration instead of an adapter swap. Snapshot columns plus an `import-linter` contract in CI from C2.

## Open questions for the human

1. **How does the browser reach the API?** (a) Next `/bff/*` proxy for everything, browser never learns the API origin, recommended. (b) Direct browser-to-API with CORS and `NEXT_PUBLIC_API_BASE_URL`. (c) Proxy only auth and mutations, direct for public reads.
2. **What identifies a guest to itself?** (a) `HttpOnly` per-registry cookie issued on the first write, recommended. (b) Opaque reservation token in the response body, held in `sessionStorage`. (c) No token: writes are fire-and-forget and only the couple can release. (d) Cookie plus optional first name as the sole linkage.
3. **Where does the payment handle live?** (a) A separate rate-limited reveal endpoint, never in the registry payload, recommended. (b) Inline in `PublicRegistry`, on the argument that the page is already unlisted. (c) Reveal endpoint gated behind a short-lived interaction token issued with the registry read.
4. **How real is catalog in the POC (ties to O1)?** (a) Seed-only in every checkpoint. (b) Seed-only for guests, live Shopify product JSON for the couple's paste-a-link in C5. (c) Live reads first with the seed as fallback, which stretches D4.
