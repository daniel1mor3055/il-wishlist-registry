---
name: discovery-council
description: Runs a short adversarial multi-agent product discovery round for the Israeli baby registry project. Use when scoping a new surface, feature, or phase and the requirements are still fuzzy, or when the user asks to brainstorm, challenge scope, or run the council.
disable-model-invocation: true
---

# Discovery council

A bounded brainstorming round. Four specialists write one brief each, in parallel, then the orchestrator consolidates once and takes disputes to the human. The point is convergence, not debate volume.

## Hard rules

- **One round.** Agents never reply to each other. If a second round is truly needed, it must be one targeted question to one agent.
- **Parallel launch.** All four agents start in a single message.
- **No code.** Discovery produces docs. Agents do not write application code, schemas, or infrastructure.
- **Read [docs/decisions.md](../../../docs/decisions.md) first** and treat every `LOCKED` row as non-negotiable. An agent may flag a locked decision as risky, but may not design against it.
- **Disputes go to the human**, not to another agent round. Present both sides in one AskQuestion call.

## The four seats

| Seat | Job | Bias to apply |
|---|---|---|
| Product | Jobs-to-be-done for couple, guest, retailer | What must exist for this to feel like the reference product in Israel |
| Adversary | Kill scope, kill imported assumptions | Attack anything that only works in the US market or only at seed-stage scale |
| UX | Flows and every non-happy state | Empty, loading, reserved, partially funded, expired, error, RTL |
| Integrator | What "easy for shops to adopt" concretely means | Widget contract, data the shop must supply, what stays mocked |

## Brief format

Every agent writes `docs/council/<seat>.md`, max 150 lines, with exactly these sections:

```markdown
# <Seat> brief

## Goals
## Must-haves for v1 design
## Non-goals
## Top 5 risks
## Open questions for the human
```

Open questions: max 4 per agent, each with 2-4 concrete options. A question with no options is not a question, it is a shrug.

## Consolidation

The orchestrator writes `docs/council/consolidation.md`:

1. **Agreed** - anything two or more seats independently asked for.
2. **Disputed** - conflicts, each with the competing positions named by seat.
3. **Dropped** - suggestions rejected, with the one-line reason.
4. **For the human** - the deduplicated question set, ranked by how much it changes the design.

Then ask the human the top disputes only. Fold answers back into [docs/decisions.md](../../../docs/decisions.md).
