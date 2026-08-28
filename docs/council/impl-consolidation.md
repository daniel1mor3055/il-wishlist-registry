# Implementation council: consolidation

Merges the four implementation briefs: [architect](impl-architect.md), [domain and data](impl-domain.md), [adversary](impl-adversary.md), [frontend](impl-frontend.md).

Authority order is unchanged: [decisions.md](../decisions.md) first, [prd.md](../prd.md) second, these briefs third.

Process note, recorded for honesty: the architect brief was written by an independent agent. The other three seats were written directly by the orchestrator after the subagent runner failed four consecutive launches. The seats were written in isolation from each other and each was instructed to argue its own angle, but they are less independent than the discovery council was, and the disputes below are correspondingly less adversarial than they would otherwise be.

## Where all four seats agree

Treat these as settled unless you object.

| Agreement | Seats |
|---|---|
| **Privacy by construction, not by discipline.** Two hand-written response models per entity, a golden-key test on the public payload's exact key set, no ORM object ever returned from a router | architect, domain |
| **The catalog is snapshotted onto the item.** `chain_slug`, `external_id`, `canonical_url`, `title`, `image`, `price_at_add` copied at add time. No foreign key ever crosses into a catalog table | architect, domain |
| **`CatalogPort` survives; nothing behind it does.** One Protocol, two methods, one seeded implementation. No normalisation pipeline, no adapter registry, no retry layer | architect, adversary |
| **The guest is identified to itself by an `HttpOnly` per-registry cookie**, issued on first write, plus an idempotency key on every guest POST | architect, domain |
| **Reserving is a conditional update, not a read-then-write.** `WHERE quantity_claimed < quantity_wanted RETURNING`, one transaction, `409` on zero rows | architect, domain |
| **The concurrency test lands with the first write, not in a hardening pass.** Two overlapping transactions on the last unit, one `201`, one `409` | architect, domain, adversary |
| **The API returns error codes; the web owns every Hebrew string.** One `copy.ts` table keyed to PRD section 7 rows and to error codes | architect, frontend, adversary |
| **C1 fixtures are typed as the real API models** from the start, so C2 replaces a loader rather than a data model | architect, frontend |
| **Drop the device mockup, build a dev state gallery.** `/dev/states` renders all nineteen PRD section 7 states inside a 390x844 frame, from C1 | frontend, adversary |
| **Vendor the product images** into `public/seed/`. Unsplash hotlinks break offline dev and make the broken-image state untestable | frontend, adversary |
| **The browser never learns the API origin.** Guest writes go through Next route handlers under `/bff/*` | architect, frontend |
| **Blessings have no public read path at all** — no endpoint, no view, no column, not even echoed back to the guest who wrote it | architect, domain |

## Genuine disputes, and things the plan did not decide

Six items need your call. They are in the questions I am about to ask you; recorded here so the reasoning survives.

### 1. Where the web dev server runs

The adversary seat argues the single highest-frequency cost in the project is the edit-save-look cycle, and that containerising the Next dev server on macOS is the worst version of it: bind-mounted `node_modules`, file watching through the VM boundary, rebuilds on dependency changes. It proposes `next dev` on the host against containerised `api`, `db` and `mailpit`, with a compose profile for the full-topology check.

Against: you chose Docker specifically to simulate microservices, and a topology you rarely run is a topology that quietly breaks.

### 2. Checkpoint granularity

The adversary seat says C3 is three checkpoints wearing one name — reserve, the race and rollback, handoff, self-report, cross-window taken state, group contributions, fund contributions, contact reveal, blessing, plus the guest cookie and idempotency — and that it contains the only genuinely hard problem in the project. It also says two checkpoints for ten editor screens will each overrun by roughly double.

Proposal: eight checkpoints. C3 splits into the double-buy core and the money surface; the editor splits into three sliced by capability; hardening becomes C7.

### 3. The C1 gate, and the phone frame

Frontend and adversary agree the frame, the fake iOS status bar and the home indicator are artifacts of how Figma Make previews a design, and that shipping them means building a mockup instead of a website. But your C1 gate is literally "does it look like the Make render", which rewards porting them verbatim.

Proposal: `/r/[slug]` is a real responsive page; `/dev/states` renders each state inside a 390x844 frame for a true side-by-side. The C1 gate becomes a 390px-viewport comparison.

### 4. Public read isolation

The architect brief says two response models plus a golden-key test. The domain brief says that is contract-level and not structural, and adds a database view containing only public columns, which the public read path queries exclusively — so a serialiser bug cannot leak, because the column is not in the result set. Cost is one migration.

### 5. Registry slug shape

The architect brief says an unguessable slug of at least 22 characters is the sole capability. The domain brief says PRD risk 1 is that the link reads as phishing in a WhatsApp group, and proposes a readable prefix with a random suffix — `noa-itai-k4m2xq8vp3wt` — trading a little guessability for recognisability. Both agree on `noindex` regardless.

### 6. Catalog fidelity, closing O1

All four target chains run Shopify and expose public product JSON today, which stretches D4's "mocked catalogs". Seed-only in every checkpoint is the conservative read of D4; live reads for the couple's paste-a-link flow is the one place real data would be visible in a demo.

## Decided without asking you

Small enough, or clearly correct enough, that I am proceeding unless you say otherwise.

| Decision | Reason |
|---|---|
| **The C5 Open Graph gate is verified by a dev-only `/dev/og` page** that fetches a URL server-side, parses the real meta tags out of the returned HTML, and renders a WhatsApp-shaped card. WhatsApp's crawler cannot reach localhost, so the gate as written could only be failed or faked. A `cloudflared` tunnel stays optional and the gate does not depend on it | adversary risk 3 |
| **Money is `INTEGER` agorot.** Exact sums, clean integer comparison inside the conditional update, no rounding | domain |
| **The seed contains seven registries, not one** — main, empty, single-item, fully-claimed, draft, post-birth, closed. Seven of the nineteen PRD states are registry-level and cannot coexist in one registry | domain, adversary |
| **Lint, format and typecheck for both languages land at C1**, along with `.env.example` and a one-command bootstrap. Thirty minutes now, a day of churn later | adversary |
| **`category` is added to the public item payload.** The PRD's branded broken-image placeholder needs a category glyph, so the contract has to carry it | frontend |
| **Hardcoded meter percentages die in the port.** `(1 - 550/1290)` becomes a `money.ts` helper over real remaining and total, or the meters lie the moment data is live | frontend |
| **Two counters are stored on the item** — `quantity_claimed` and `contributed_agorot` — because you cannot lock a derived value. Everything else about item state is derived, and a reconciliation test guards the drift | domain |
| **Up and down buttons instead of drag-to-reorder** in the editor. PRD `ed-C2` asks for drag; a touch-and-RTL-correct drag list is most of a day and demonstrates nothing extra | adversary |
| **The thank-you composer is a copy-ready Hebrew text block plus a `thanked_at` flag.** No channel integration, no templating, no send tracking | adversary |
| **A round-three row is added to the decision log superseding D10**, which currently reads "This phase produces docs only... No application code" and would otherwise contradict the repo on day one | adversary |

## The one thing every seat pointed at

Different angles, same conclusion: **the reserve path is the product.** The architect made it the only endpoint with a documented race contract, the domain seat built the schema around a single CHECK constraint and a conditional update, the adversary called C3 the checkpoint where the product either works or does not, and the frontend seat called the optimistic reserve with rollback the one piece of client state that must be reversible.

D8 is the reason a couple shares the link, and self-reporting (D12) is the only evidence we will ever have. Everything else in this POC is a form over a ledger.
