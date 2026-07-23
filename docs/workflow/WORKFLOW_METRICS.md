# Workflow Effectiveness Metrics

Lightweight, ongoing measures per Part 7 / Phase 11 of the workflow
upgrade. Update after each nontrivial task closeout (Phase 10, step 8).
Do not optimize for agent count, document count, or high scores — use
this to simplify routes that add ceremony without catching problems, and
to strengthen routes where defects escape.

| Date | Task ID | Risk class | Agents used | Defects found after "ready" | Tickets reopened/re-specified | Verifier failures caught pre-review | Review findings (by severity) | Rollback/recovery evidence present (Y/N, high-risk only) | Stale-doc contradictions found | Approx. cost vs. task size |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-23 | workflow-upgrade | N/A (meta/tooling) | Governor(self), no full loop invoked | 0 so far | 0 | N/A — paper dry runs only, see WORKFLOW_AUDIT.md | see WORKFLOW_AUDIT.md | N/A | 1 (Supabase-vs-local-first note reconciled, see PLATFORM_STATE.md) | moderate — one long session, no code changes |

No feature work has run through the full upgraded loop yet — this table
seeds the format. The first real task should append a row here at
closeout.
