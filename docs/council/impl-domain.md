# Domain and data brief

Angle: the schema and the invariants. `C1`-`C6` are implementation checkpoints; PRD couple-editor screens are cited as `ed-C5`, `ed-C9`.

## Goals

1. **The schema makes double-buy impossible, not unlikely.** D8 is the product's reason to exist, and it rests entirely on self-reported state (D12). A CHECK constraint and a conditional update are the mechanism; UI discipline is not.
2. **Money is a ledger, never a transaction.** D11 means a contribution row records that a guest *says* they sent money elsewhere. Nothing in the schema can be mistaken for a payment.
3. **Privacy is physical.** A public query must not be able to select a giver name or a per-guest amount, even if a serialiser is wrong (D8, D15, D17).
4. **Ledger rows are immutable, targets are not.** A couple editing a fund goal must never rewrite history.
5. **The seed can demonstrate all nineteen PRD section 7 states**, which requires more than one registry.

## Must-haves for the POC

### Entities

| Table | Module | Owns | Key fields |
|---|---|---|---|
| `couples` | identity | the account | `id`, `email` (unique, lowercased), `display_name` |
| `magic_tokens` | identity | login | `token_hash`, `couple_id`, `expires_at`, `consumed_at` (single-use) |
| `sessions` | identity | the session | `token_hash`, `couple_id`, `expires_at` |
| `registries` | registry | the list | `id`, `couple_id`, `slug` (unique), `couple_names`, `story`, `cover_image`, `city`, `due_date`, `lifecycle` (`draft`/`published`/`post_birth`/`closed`), `baby_name`, `born_on`, `bit_handle`, `paybox_handle`, `payment_display_name` |
| `registry_items` | registry | one row per tile | `id`, `registry_id`, `kind` (`product`/`fund`/`voucher`), `position`, `title`, `note`, `priority`, `quantity_wanted`, `quantity_claimed`, `image_url`, `category`, `group_gift_enabled`, `target_agorot`, `contributed_agorot`, `is_active`, `out_of_stock`, plus catalog snapshot: `chain_slug`, `chain_name`, `external_id`, `canonical_url`, `price_agorot` |
| `reservations` | gifting | a hold and its self-report | `id`, `item_id`, `registry_id`, `guest_token_hash`, `giver_name`, `status` (`held`/`purchased`/`released`), `created_at`, `reported_at`, `released_by` (`guest`/`couple`), `thanked_at` |
| `contributions` | gifting | the ledger | `id`, `registry_id`, `item_id`, `guest_token_hash`, `giver_name`, `amount_agorot`, `declared_sent_at`, `created_at`, `thanked_at` |
| `blessings` | gifting | a private message (D17) | `id`, `registry_id`, `guest_token_hash`, `giver_name`, `message`, `created_at` |
| `idempotency_keys` | gifting | replay defence | `key`, `guest_token_hash`, `endpoint`, `response_hash`, `created_at` |
| `catalog_chains` | catalog | the four chains | `id`, `slug`, `name_he`, `site_url` |
| `catalog_items` | catalog | mock cards | `id`, `chain_id`, `external_id`, `title_he`, `category`, `price_agorot`, `image_path`, `canonical_url`, `in_stock` |

No foreign key ever crosses from `registry_items` into `catalog_items`. The catalog columns on the item are a **snapshot taken at add time**, which is also why the PRD's `המחיר מתעדכן באתר החנות` disclaimer is honest rather than decorative.

One deliberate POC simplification, stated openly: one registry per couple. `registries.couple_id` is there so lifting the restriction is a constraint drop, not a migration.

### Stored versus derived

The item's *display* state is fully derived. Two *counters* are stored, and only because you cannot take a row lock on a computed value.

| Thing | Stored or derived | Why |
|---|---|---|
| `quantity_claimed` | **stored** on the item | the lock target and the subject of the CHECK constraint |
| `contributed_agorot` | **stored** on the item | same, for funds and group gifts |
| `available` / `reserved` / `purchased` | derived | `quantity_wanted - quantity_claimed`, plus reservation statuses |
| `נשארו 2 מתוך 4` | derived | `quantity_wanted - quantity_claimed` |
| `נותרו ₪550 מתוך ₪1,290` | derived | `max(0, target_agorot - contributed_agorot)` |
| registry progress (`נתפסו 4 מתוך 12`) | derived | count over items |
| fund complete | derived | `contributed_agorot >= target_agorot` |

The two counters are a denormalisation, so a test asserts reconciliation: `quantity_claimed == count(reservations WHERE status IN ('held','purchased'))` and `contributed_agorot == sum(contributions.amount_agorot)` for every seeded item. If that test is missing, the counters will drift and the drift will present as a phantom taken item.

### The awkward cases

| Case | Behaviour |
|---|---|
| Quantity 4, two claimed | `quantity_claimed = 2`. Card stays live with a counter chip. Fully claimed only at `2 == quantity_wanted` |
| Reserved, never confirmed | Stays `held` indefinitely. No countdown, no expiry job (D16). The tracker surfaces age so the couple can release; that is the entire mitigation for PRD risk 2 |
| `עוד לא` on the report modal | `reported_at` set, `status` stays `held`. The hold survives; the guest said "not yet", not "no" |
| Group gift funded ₪740, couple lowers the goal to ₪600 | Ledger untouched. `remaining = max(0, 600 - 740) = 0`, fund reads complete. Never negative, never a refund concept (D11) |
| Couple releases a held item | `status = released`, `released_by = 'couple'`, decrement the counter in the same transaction. Item returns to available |
| Couple corrects `purchased` back to available | Same path. `status = released`, counter decremented, an audit trail left by keeping the row rather than deleting it |
| Item deleted after being claimed | Soft delete via `is_active = false`. Hard delete would orphan tracker history the couple needs for thank-yous |

### Invariants

| # | Invariant | Mechanism |
|---|---|---|
| I1 | `0 <= quantity_claimed <= quantity_wanted` | CHECK constraint. This is the double-buy guard of last resort |
| I2 | Reserving the last unit is atomic | `UPDATE registry_items SET quantity_claimed = quantity_claimed + 1 WHERE id = :id AND quantity_claimed < quantity_wanted RETURNING id`, in one transaction with the reservation insert. Zero rows returned means `409`, not an exception |
| I3 | One guest cannot hold one item twice | Partial unique index on `(item_id, guest_token_hash) WHERE status <> 'released'`. Covers the double-tap and the back-button re-POST |
| I4 | A replayed POST does not create a second row | `idempotency_keys` on `(key, guest_token_hash)`; contributions need this because a guest legitimately may contribute twice, so no natural uniqueness exists |
| I5 | Amounts are positive | CHECK `amount_agorot > 0` |
| I6 | Contributions are append-only | No UPDATE or DELETE path in the gifting service. Corrections are new rows or a `voided_at` flag, never edits |
| I7 | Lifecycle moves forward only | `draft -> published -> post_birth -> closed`, plus `published -> closed`. Named transitions, validated in the service. No PATCH of a raw state column |
| I8 | Writes are refused unless `lifecycle = published` or `post_birth` | A draft or closed registry accepts no gifts |

I2 is the one to test with real concurrency, not with sequential calls. Two overlapping transactions on the last unit, asserting exactly one `201` and one `409`. That test belongs in the checkpoint that introduces reserving, not in a hardening pass.

### Privacy at the query level

Three layers, cheapest first, because the leak is silent and SSR puts the payload in the page source:

1. **A database view.** `public_registry_items` selects only public columns: no `guest_token_hash`, no `giver_name`, no `amount_agorot`, no `payment_handle`. The public read path queries the view and nothing else. A serialiser bug then cannot leak, because the column is not in the result set.
2. **Separate response models**, per the architect brief. Contract-level.
3. **A golden-key test** asserting the exact key set of the public payload, so a new column cannot appear by default.

Layer 1 is one migration and is the only layer that is structural rather than a matter of remembering. `bit_handle` and `paybox_handle` live on `registries` but are excluded from any public view; they reach a guest only through the reveal endpoint on explicit interaction (D13, D50).

Blessings have no public read path at all — no endpoint, no view, no column. The submitting guest does not get their own blessing echoed back.

### Slugs and tokens

| Token | Shape | Entropy |
|---|---|---|
| Registry slug | readable prefix plus random suffix: `noa-itai-k4m2xq8vp3wt` | 64+ bits in the suffix |
| Guest token | 128-bit random, stored hashed, in an `HttpOnly` cookie scoped to the registry path | 128 bits |
| Magic token | 128-bit random, stored hashed, single-use, 15-minute expiry | 128 bits |
| Session token | 128-bit random, stored hashed, 30-day expiry | 128 bits |

The readable prefix is not decoration. PRD risk 1 is that the link reads as phishing in a WhatsApp group; `.../r/noa-itai-k4m2xq8vp3wt` is recognisably about Noa and Itai while staying unguessable. Pure random satisfies "unlisted" and fails the trust goal. Everything is `noindex` regardless.

A leaked link is a leaked registry, and that is accepted: the capability model is the link, exactly as Babylist. What a leaked link must never expose is *who gave what* or *how much*, which is why the view in layer 1 matters more than slug entropy.

### Money

`INTEGER` agorot, named `*_agorot`. Not float, because sums must be exact. Not `NUMERIC`, because we never do fractional arithmetic and integers compare cleanly inside I2's conditional update. A `currency` column exists set to `ILS` for shape only. Formatting to `₪1,290` happens in one web-side helper, never in the database or the API.

### Seed

The plan says "the נועה ואיתי demo registry", singular. PRD section 7 has registry-level states that one registry cannot show at once, so the seed needs several:

| Slug intent | Demonstrates |
|---|---|
| `noa-itai-...` (main) | the eight reference cards A-H, published, partially claimed, group gift at ₪740/₪1,290, quantity 2-of-4, one taken item, a fund, a voucher |
| empty | `נועה ואיתי עוד מכינים את הרשימה` |
| single item | the full-width hero card |
| fully claimed | the celebratory band with funds promoted |
| draft | `הרשימה עדיין לא פורסמה` |
| post-birth | the announcement hero and re-sorted list |
| closed | the read-only thank-you summary |

Also seeded: four chains, roughly fifteen catalog cards each across the six PRD categories, one long-Hebrew-name card, one out-of-stock card, one card with a deliberately broken image path. The seed must be idempotent and re-runnable, keyed on stable slugs rather than autogenerated ids.

## Non-goals

- No payments, transactions, balances, payouts, refunds, escrow or fund custody tables (D11).
- No automatic purchase detection, retailer webhooks, or live price and stock sync.
- No guest accounts, guest profile, guest history, or any guest-visible view of another guest.
- No public blessings table, view, or endpoint (D17).
- No reservation expiry job, TTL, or countdown; deliberate, per D16.
- No soft-delete or audit framework beyond the specific columns above.
- No multi-tenant, multi-occasion, or multi-registry-per-couple modelling; the FK is present, the constraint is not lifted.
- No event sourcing, outbox, or CQRS. The two counters are the only denormalisation.

## Top 5 risks

1. **Counter drift.** `quantity_claimed` and `contributed_agorot` are duplicated truth. Any write path that forgets to update them in the same transaction produces a phantom taken item, which is exactly the failure the product exists to prevent, and it will be invisible until a guest complains. The reconciliation test is not optional.
2. **The silent privacy leak.** SSR means the public payload is in the page source, scrapeable by anyone with the link. A giver name reaching the public read breaks D8 and nothing fails loudly. Only the view makes this structural.
3. **Self-reporting is unenforceable and the schema cannot fix it.** A guest reserves the best item and vanishes. All the schema can do is make the couple's release control cheap and make the hold's age visible. If the tracker does not surface age, D16 is a decision with no implementation.
4. **Ledger mutability creeping in.** The first time someone "just fixes" a contribution amount with an UPDATE, the fund total stops being reconstructible and the couple's tracker starts lying. I6 needs to be a service-layer rule from the first write.
5. **A one-registry seed quietly caps what we can review.** If the seed only has the happy-path registry, seven of the nineteen states have no way to be seen, and they will be skipped and then discovered at C6 as new feature work.

## Open questions for the human

1. **Public read isolation.** (a) A database view plus separate response models plus a golden-key test, recommended, one extra migration. (b) Separate response models plus the test, no view, per the architect brief. (c) One model with field exclusion, cheapest and the easiest to break.
2. **Registry slug shape.** (a) Readable prefix plus 64-bit random suffix, recommended, trades a little guessability for the anti-phishing goal in PRD risk 1. (b) Pure random 22-character slug, maximally unlisted, reads like a tracking link in WhatsApp. (c) Couple-chosen vanity slug with a uniqueness check, most shareable and genuinely guessable.
3. **Reservation holds.** (a) Never expire; the couple releases manually, recommended, matches D16 exactly. (b) Never expire for the guest, but the tracker flags holds older than seven days, recommended addition on top of (a). (c) Auto-release after N days, which contradicts D16's "no countdown" if we ever tell the guest, and is dishonest if we do not.
4. **Correction semantics in the tracker.** (a) Corrections release the reservation and keep the row with `released_by = 'couple'`, recommended, auditable. (b) Corrections hard-delete the reservation, simpler, loses the thank-you history. (c) Corrections write a compensating row, most rigorous, more machinery than a POC needs.
