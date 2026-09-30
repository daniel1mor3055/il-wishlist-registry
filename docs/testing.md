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
is rolled back (except the three race files, which commit for real and clean up).

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
| Tracker read, isolation per couple, released excluded, guest id never exposed (D52) | `test_tracker.py` |
| Couple release and mark-bought, no-ops, 409 `gift_state_changed`, 404 for another couple's gift, `resolved_by` for guest and couple (D16, D53) | `test_couple_corrections.py` |
| Committed races: couple release vs guest release, vs report-yes, vs report-no on a purchased unit; quantity 2 so the `quantity_claimed > 0` guard cannot mask a double decrement (D53) | `test_couple_release_race.py` |
| Seeded ledgers reconcile with counters (D57) | `test_seed_ledger.py` |
| Close and reopen: unpublished cannot close, first stamp kept, reopen lets guests hold, unpublished reopen returns, another couple's close leaves this list alone (D56) | `test_owner_registry.py` |

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
| `c5-editor.spec.mjs` | C5 | Wizard: names, due date, skippable address, unpublished banner (D30). Catalog add shows the price. Untouched quantity and remove; a guest hold locks the floor and the home × (D45). Publish is disabled while the home list has no visible items (after hiding the default חיבוק), then `/r/{slug}` works and was 404 before (D30) |
| `c6-editor.spec.mjs` | C6 | Payment/story/share screens. Preview is display-only. Unpublished `/r/{slug}` stays 404 (D30). Bit with no number is Hebrew, not `משהו נתקע` |
| `c7-couple-ledger.spec.mjs` | C7 | Unsigned tracker sends the couple to the door. Tracker read-only on the demo. Release, mark-bought then release. An open guest page drops a released hold (D16, D53). Close and reopen (D56) |
| `a11y.spec.mjs` | C8 | Published guest list and signed-in editor home: serious and critical WCAG 2.0/2.1 A and AA violations (moderate and minor ignored) |

First time on a machine:

```bash
npm run test:e2e:install
```

Then, with the API up:

```bash
npm run dev          # or leave it, Playwright will start it
npm run test:e2e
```

Specs that write (C3 holds, C6 new couples, C7 ledger) are serial. C3 uses
`single-item-demo` so it cannot pass against the wrong card. C5, C6, C7, and
the a11y spec need Mailpit: they sign in through a real magic link.

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

C6 owner API (handle not in the public payload, cover/story published)
belongs in `test_owner_registry.py` next to the other couple writes.
The Playwright file is the screens.

## What this is not

- A substitute for reading the page. If a spec is green and the Hebrew is
  wrong, the spec asserted the wrong string.
- Permission to hit the API from the browser. Guest e2e goes through `/r/…`
  and `/bff`, the same as a person.
- Load testing. The race files are about oversell, not throughput.
