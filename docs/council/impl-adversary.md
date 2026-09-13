# Adversary brief

Angle: attack the plan before it costs a week. Every criticism carries a cheaper alternative, because criticism without one gets ignored. `C1`-`C6` are implementation checkpoints.

## Goals

1. **Protect the inner loop.** One person building this will run the edit-save-look cycle a thousand times. Anything that adds ten seconds to it is the most expensive decision in the plan.
2. **Find the rework traps**, which are the choices that look free at C1 and force a rewrite at C4.
3. **Make every gate actually verifiable.** A gate the human cannot check is not a gate, it is a rubber stamp.
4. **Cut everything that does not earn its place in a POC**, and say what it costs to add back later.

## Must-haves for the POC

What survives my own attack.

**The stack survives, with one change.** Two runtimes for a one-person POC is genuinely more expensive than Next route handlers plus Drizzle, probably by a third of total build time. I am not relitigating it, because the human chose Docker microservices and FastAPI as an explicit architectural goal, not by accident, and a POC that teaches the wrong architecture is worthless to them. But the cost is real and it lands almost entirely in the inner loop, so:

> **Run `next dev` on the host, not in a container.** Compose owns `api`, `db` and `mailpit`; the web dev server runs on the host against `localhost:8000`. Compose still defines a `web` service for the "does the whole thing come up together" check, behind a profile so it does not run by default.

This removes the single worst source of containerised-dev pain on macOS — bind-mounted `node_modules`, slow file watching through the VM boundary, and rebuilds on every dependency change — while keeping the microservice topology the human actually wants. The API in a container is fine: `uvicorn --reload` over a bind mount is fast because the tree is small and Python has no `node_modules`.

**The catalog resolver port survives.** It is one Protocol with two methods, roughly twenty lines, and O1 is explicitly still open, so the human may switch to live Shopify JSON mid-POC. What does not survive is anything *behind* it: no chain-agnostic normalisation pipeline, no per-chain adapter registry, no retry and backoff layer. One seeded implementation, one interface, nothing else.

**Tailwind v4 survives, but must be proven before the port.** v4 moved configuration into CSS (`@theme`, `@tailwindcss/postcss`) and most material on the internet still describes v3's `tailwind.config.js`. The risk is an afternoon lost to a token pipeline that silently does nothing. Mitigation: pin exact versions, and at C1 verify one token round-trip (`@theme` variable to a generated utility class to a rendered colour) with a throwaway component *before* porting nine hundred lines.

**The seven states of the state gallery survive as a C1 deliverable, not a C6 one.** See the frontend brief. It is the only honest way to run the C1 and C6 gates.

**Missing from the plan entirely, and needed:**

| Gap | Cost now | Cost later |
|---|---|---|
| Lint, format, typecheck for both languages (ruff, eslint, prettier, `tsc --noEmit`, `mypy` on the api) | 30 minutes at C1 | a day of churn and inconsistent code |
| Any CI at all — the architect brief asks for an `import-linter` contract in CI, and there is no CI | an hour | the seam erodes with nothing watching |
| A test strategy before C6. The concurrency test for the reserve race cannot wait for a hardening pass | it is one test | a shipped double-buy |
| `.env.example` and a documented one-command bootstrap | 20 minutes | the project is unrunnable by anyone else, including the human in a month |
| One Hebrew copy table as a single artifact | an hour | strings scatter across components and drift from the PRD, and PRD risk 5 says RTL and copy errors are the invisible kind |
| Product image assets. The reference hotlinks Unsplash; nothing in the plan says where images come from | an hour to vendor eight files | broken demo, offline dev, and the broken-image state is untestable |
| Multiple seed registries, per the domain brief | small | seven PRD states have no way to be seen |
| `docs/decisions.md` D10 literally reads "This phase produces docs only... No application code" | one row | the decision log contradicts the repo on day one, and it is the stated source of truth |

## Non-goals

Cut, each with the reason.

- **The fake phone frame and the fake iOS status bar.** They are artifacts of how Figma Make previews a design, not part of the design. Shipping them means building a device mockup instead of a website.
- **Live retailer reads anywhere in C1-C3.** Seed only. Answer O1 as seed-only unless the human wants the paste-a-link demo specifically.
- **Drag-to-reorder in the editor.** PRD `ed-C2` asks for drag. A pointer-sensor drag list that works on touch and in RTL is most of a day. Up and down buttons are twenty minutes and demonstrate the same capability. Add drag back post-POC.
- **The thank-you composer as a channel integration.** Reduce to a copy-ready Hebrew text block per gift plus a `thanked_at` flag. No WhatsApp deep links, no templating engine, no send tracking.
- **Guest-facing polish that D11 makes moot:** no order summaries, no receipts, no gift-receipt flows, no "your gift is on its way" tracking. We do not know and cannot know.
- **Generated API clients and OpenAPI type generation before C2.** At C1 there is one endpoint. Hand-write the fixture types once, per the architect brief, and generate from C2.
- **Docker for the web dev server**, per the must-have above. Kept as a compose profile for the topology check.
- **Any auth beyond couple-owns-registry.** No roles, no refresh tokens, no password fallback, no OAuth.

## Top 5 risks

Ranked by expected cost.

1. **C3 is secretly three checkpoints, and it hides the hardest problem in the project.** Read what is in it: reserve, the race and the 409 rollback, outbound handoff, the self-report modal, taken state visible cross-window, group-gift contributions, fund contributions, contact reveal, and the private blessing. That is eight distinct flows plus the entire concurrency story plus the guest-token cookie plus idempotency. It is the checkpoint where the product either works or does not, and it is sized like the others.

   Cheaper: split it. **C3a** is the double-buy core — guest token, reserve, the conditional update and 409, self-report, taken state, and the two-window gate. **C3b** is the money-adjacent surface — contributions, contact reveal, blessing, confirmation. C3a is the one that must be right; C3b is mostly forms over a ledger.

2. **The editor is two checkpoints for ten screens.** `ed-C1` through `ed-C10` is a create wizard, an editor home with reordering, a three-tab add-item flow, item settings, funds and payment details, story and cover, preview-as-guest, publish and share, the gift tracker, and settings and lifecycle. That is more surface area than C1 through C3 combined, and C4 and C5 as written will each overrun by a factor of two.

   Cheaper: three checkpoints, sliced by capability rather than by screen count. **C4** is identity plus create plus add-item from seed plus item settings — enough to build a list. **C5** is funds, payment handle, story and cover, publish and share. **C6** is the tracker, release and correct, thank-you, and lifecycle. The old C6 hardening becomes **C7**.

3. **The C5 gate is not verifiable as written.** It asks the human to "paste the link somewhere that renders a preview card" while everything runs on localhost. WhatsApp's crawler cannot reach localhost. Neither can Slack's, Twitter's, or any validator. The gate as written can only be failed or faked.

   Cheaper, and better than a tunnel: build a dev-only `/dev/og` page in the web app that takes a URL, fetches it server-side, parses the actual meta tags out of the returned HTML, and renders them in a WhatsApp-shaped card. It tests the real thing — that the server emitted correct tags at that URL — deterministically, with no account and no tunnel. Optionally add a `cloudflared` quick tunnel as a one-shot confirmation, but do not make the gate depend on it.

4. **Porting `App.tsx` wholesale looks mechanical and is not.** It is a device mockup with inline style objects, `direction: rtl` on a nested div rather than the document, hardcoded funding percentages like `(1 - 550/1290)`, Unsplash hotlinks, physical `right-2` positioning throughout, and at least one real RTL defect still live at `6967bdb` (the toast close button on the wrong side). Port it verbatim and you get something that passes the C1 gate and is wrong underneath, with every wrongness now load-bearing.

   The trap is subtler than "port it properly", because the C1 gate is literally "does it look like the Make render", which rewards verbatim porting. Cheaper: **port the visual output faithfully and discard the scaffolding** — drop the frame, `dir="rtl"` on `<html>`, colours to `@theme` tokens, images vendored locally, meters computed from data, logical properties instead of physical. Then define the C1 gate as a 390px-viewport comparison against the render, side by side in the state gallery. Same rigour, honest foundation.

5. **The inner loop, if the web dev server goes in Docker.** Concretely: `docker compose up` on a cold cache, a rebuild on every `package.json` change, file watching through the macOS VM boundary that misses events or lags by seconds, and `node_modules` either bind-mounted (slow) or volume-masked (confusing). Multiply by a thousand cycles. This is the highest-frequency cost in the whole project and it is invisible in a plan document.

## Open questions for the human

1. **Where does the web dev server run?** (a) On the host against containerised api, db and mailpit, with a compose profile for the full-topology check, recommended. (b) In a container like everything else, matching the stated microservices goal at a real cost to every edit cycle. (c) In a container, but with a documented host-mode escape hatch when the loop gets painful.
2. **Do we re-slice the checkpoints?** (a) Six as planned, accepting that C3, C4 and C5 will overrun. (b) Split C3 into the double-buy core and the money surface, and the editor into three, giving eight checkpoints, recommended. (c) Split C3 only, leaving the editor at two and re-slicing when it hurts.
3. **How is the C5 Open Graph gate verified?** (a) A dev-only OG preview page that parses real meta tags server-side, recommended. (b) A `cloudflared` quick tunnel and a real WhatsApp message. (c) Both: the dev page as the gate, a tunnel as a one-off sanity check.
4. **What happens to D10 in the decision log?** (a) Add a round-three row superseding it, recording that the implementation phase is now open, recommended. (b) Edit D10 in place. (c) Leave it and accept that the source of truth contradicts the repo.
