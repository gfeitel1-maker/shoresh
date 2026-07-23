# Shoresh Engineering Workflow (Governor → Designer/Architect → Maker → Verifier → selected reviewers → Grader-if-needed)

This document is the phase-by-phase description of the upgraded workflow.
It supplements, not replaces, `~/.claude/WORKFLOW_CONSTITUTION.md` (global)
and the agent profiles in `.claude/agents/`.

## Phase 0 — State and documentation check

Governor: reads canonical project docs and relevant memories; creates or
resumes the task-state file; detects stale/contradictory architecture
statements; stops to reconcile contradictions that could change the
implementation.

## Phase 1 — Clarify product intent

Use `grill-with-docs` or existing brainstorming/grilling behavior to
clarify: user-visible outcome, operational reason, success predicate,
non-goals, edge cases, affected users and data, reversibility, and any
constraints the user understands. Do not overwhelm the user with
low-level implementation choices.

## Phase 2 — Classify the work

Classify as one or more of: trivial change, UI/interaction change,
ordinary feature, bug diagnosis, architecture decision, migration/data
change, security-sensitive change, long-horizon initiative. Assign a
risk level:

- **Low** — local, reversible, no sensitive data, no persistence/
  permission effect.
- **Moderate** — meaningful user behavior or multiple modules, settled
  architecture, contained rollback.
- **High** — persistence, sync, auth, permissions, migrations,
  destructive actions, sensitive data, or broad architectural
  consequences.

Governor records the selected route and skipped roles before dispatch.

## Phase 3 — Architecture and design as needed

- UI-significant → Designer.
- Core architecture/data/sync/auth/module-boundary change → Architect.
- Multiple credible approaches → Architect invokes `adhd`.
- Difficult unknown bug → Maker or Architect invokes `diagnosing-bugs`;
  `adhd` only after disciplined diagnosis needs wider hypotheses.
- Large unresolved initiative → `wayfinder`.

Record consequential decisions in `docs/adr/`.

## Phase 4 — Specification

Governor uses `to-spec` after clarification and architecture/design work.
Specification must include: context and problem, user-visible success
predicate, non-goals, domain terms, architecture/ADR references, data and
security consequences, error and recovery behavior, acceptance examples,
test seams, rollout and rollback, unresolved questions. Store under
`docs/workflow/specs/`.

## Phase 5 — Tickets

Use `to-tickets` for nontrivial work. Store under `docs/workflow/tickets/`.
Each ticket must: deliver a thin vertical slice or focused investigation,
declare blocking dependencies, have observable completion evidence,
identify expected files/modules without over-prescribing code, and fit
within one Maker cycle whenever possible. If the two-round limit cannot
reasonably validate a ticket, the ticket is too large and must be split.

## Phase 6 — Implementation

Maker runs one ticket at a time with TDD at agreed seams. For UI-only
work, TDD may be replaced by appropriate component/interaction/visual
tests, but Maker must still provide evidence.

## Phase 7 — Deterministic verification

Verifier runs before subjective review. If mandatory gates fail, return
directly to Maker — do not spend parallel-review tokens scoring
known-broken work.

## Phase 8 — Selected independent review

After Verifier PASS or explicitly documented INCOMPLETE, Governor invokes
only the reviewers selected by the routing rule (Code Reviewer, Tester,
Security, Red Hat). Run selected reviewers independently and in parallel
where practical. Each receives only the relevant canonical context,
shared specification, task-state file, fixed diff boundary, and
verification report — never another reviewer's conclusions before its own
report is complete, and never Maker's self-assessment except raw
reproduction evidence unobtainable elsewhere.

## Phase 9 — Decide; grade only when needed

For small routes with one evidence source, Governor may decide directly
from Verifier and the selected review report. Invoke Grader only when
multiple reports need synthesis, findings conflict, blockers require
adjudication, or a release recommendation is requested. Grader
synthesizes without weakening absolute blockers.

Governor decides: PASS / RETRY CURRENT TICKET / SPLIT OR RE-SPECIFY /
RETURN TO ARCHITECTURE / ESCALATE FOR USER JUDGMENT.

Preserve the two-round limit for the same ticket; do not force a pass.
After two failed rounds, narrow or re-specify before continuing.

### Required backward paths

Route findings to the layer that can correct the cause:

- impossible/contradictory/misunderstood product outcome → Governor and
  possibly the user;
- architectural or testability defect → Architect;
- interaction misunderstanding → Designer and Governor specification;
- implementation defect or local complexity → Maker;
- failed deterministic gate → Maker, or Architect when the seam itself is
  wrong;
- security flaw caused by architecture → Architect, not merely a local
  patch;
- stale canonical documentation → Governor;
- routing or risk misclassification → Governor through a routing
  challenge.

Do not use Maker as the default destination for every finding.

## Phase 10 — Closeout and memory

1. Update task-state file.
2. Use `handoff` if work continues in another session or ticket.
3. Promote durable knowledge to `CONTEXT.md`, `PLATFORM_STATE.md`, or
   ADRs.
4. Update agent memory only with role-specific recurring lessons.
5. Remove stale task guesses.
6. Record verification evidence under `docs/workflow/evidence/`.
7. Commit small, coherent changes.
8. Record workflow outcome metrics for nontrivial tasks in
   `docs/workflow/WORKFLOW_METRICS.md`.

## Phase 11 — Workflow effectiveness review

Maintain `docs/workflow/WORKFLOW_METRICS.md`. Use these metrics
periodically to simplify routes that add ceremony without catching
problems, and strengthen routes where defects escape. Do not optimize
for agent count, document count, or high scores.
