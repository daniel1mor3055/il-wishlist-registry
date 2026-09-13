# How we keep this from breaking

The product is a checkpointed POC. New work is supposed to land on top of
locked behaviour, not rewrite it. This file is the map of the tests that
enforce that, and the place to add the next ones.

There are three layers, on purpose. They do not substitute for each other.

| Layer | Command | What it is allowed to catch | Needs |
|---|---|---|---|
| Types | `npm run typecheck` | The web app no longer typechecks | nothing |
| API | `npm run test:api` | A guest write, a public payload, a race, an unpublished 404 | `npm run services:up` |
| Guest e2e | `npm run test:e2e` | A screen the guest actually sees: copy, a hold that looks like someone else's, a reveal that never arrives | API + `npm run seed` + the web app |

`npm run test` is types plus the API. That is the loop while you are in the
editor or the service. `npm run test:all` is what you run before calling a
checkpoint done.

Screenshots (`npm run shoot`) are not this suite. They are for looking. A
screenshot that drifted is a review item; a failing `require` or a failing
spec is a bug.

## API tests

Live in `services/api/tests/`. Pytest, one module per product surface, run
inside the API container so they see the same Postgres the app uses. Each test
is rolled back (except the two race files, which commit for real and clean up).

When you lock a behaviour in `docs/decisions.md`, the test that would have
failed before the lock belongs next to the other tests for that surface:

| Decision-ish thing | File |
|---|---|
| Public payload is a closed key set (D8, D13, D49) | `test_public_read.py` |
| Reserve, report, release, my-holds (D12, D33, D35) | `test_reserve.py` |
| Two guests, last unit | `test_reserve_race.py` |
| Contributions, Bit reveal, blessings (D11, D13, D15, D17) | `test_money.py` |
| Contribution counter under overlap | `test_contribute_race.py` |
| No payment routes exist (D11) | `test_health.py` |
| Shipping address reveal (D49) | `test_shipping_address.py` |
| Magic link, unpublished looks like missing (D30, D42, D43) | `test_auth.py` |
| Couple editor, D45 locks | `test_owner_registry.py` |
| Catalog search | `test_catalog_search.py` |

Do not put Hebrew in the API tests. The API returns codes; the web owns words.

## Guest e2e

Live in `e2e/`. Playwright, one file per checkpoint, against the real page.
They seed the demo registries first, so leftover holds from a previous run
cannot make a spec pass by accident.

| File | Checkpoint | What it locks |
|---|---|---|
| `c1-guest-read.spec.mjs` | C1 / C2 | Published page, empty, fully claimed, not-found (D30) |
| `c3-guest-hold.spec.mjs` | C3 | Handoff X releases (D33). Report ESC keeps the hold and shows `שמור לך`, not `כבר נתפס` (D35) |
| `c4-guest-money.spec.mjs` | C4 | Envelope opens; Bit reveal is a second request (D13) |
| `c6-editor.spec.mjs` | C6 | Payment/story/share screens. Preview is display-only. Unpublished `/r/{slug}` stays 404 (D30). Bit with no number is Hebrew, not `משהו נתקע` |

First time on a machine:

```bash
npm run test:e2e:install
```

Then, with the API up:

```bash
npm run dev          # or leave it, Playwright will start it
npm run test:e2e
```

Specs that write (C3 holds, C6 new couples) are serial. C3 uses
`single-item-demo` so it cannot pass against the wrong card. C6 editor specs
need Mailpit: they sign in through a real magic link.

## Adding a test as you implement

1. If the change is an API contract — a new public field, a new error code, a
   new guest write — add a pytest. If it is a key on `PublicRegistry`, the
   golden set in `test_public_read.py` has to mention it or the test fails,
   which is the point.
2. If the change is something a guest or the couple can *see* go wrong, add a
   spec under `e2e/cN-….spec.mjs` named for the checkpoint you are in. Copy an
   existing spec. Assert Hebrew copy, not CSS class names. Prefer
   `data-testid` / `data-claim` / `data-held-by-you` for cards, roles for
   buttons.
3. If you lock a decision, name it in the spec's comment the way C3 names D33
   and D35. The next person should be able to tell *why* the assertion exists
   without reading the PRD.
4. Do not skip. If the surface is not built yet, do not add a pending spec
   that documents a lie. Add the spec in the same change that ships the
   behaviour.

C6 owner API (handle not in the public payload, cover/story published,
vouchers) belongs in `test_owner_registry.py` next to the other couple
writes. The Playwright file is the screens.

## What this is not

- A substitute for reading the page. If a spec is green and the Hebrew is
  wrong, the spec asserted the wrong string.
- Permission to hit the API from the browser. Guest e2e goes through `/r/…`
  and `/bff`, the same as a person.
- Load testing. The race files are about oversell, not throughput.
