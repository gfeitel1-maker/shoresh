# Templates: Task State, Task Contract, and Agent Handoff

This file is the reusable template. For an active feature, copy the
relevant sections into `docs/workflow/handoffs/<task-id>-state.md`.

---

## Four forms of memory (see also CONTEXT.md / CLAUDE.md precedence)

1. **Canonical project memory** — version-controlled: `PLATFORM_STATE.md`,
   `CONTEXT.md`, `docs/adr/`, `CLAUDE.md`. Authoritative; agent memory may
   not override these.
2. **Per-agent learning memory** — Claude Code subagent persistent memory
   (`memory: project` in each agent's frontmatter). Role-specific
   recurring patterns only (e.g. Maker: common implementation mistakes;
   Security: accepted exceptions and false-positive patterns). Must not
   become a second architecture document — durable/project-wide facts get
   promoted into CONTEXT.md/PLATFORM_STATE.md/an ADR.
3. **Current task state** — one living document per active feature at
   `docs/workflow/handoffs/<task-id>-state.md` (template below). This is
   the shared state object for the loop; do not rely only on conversation
   history.
4. **Session handoff** — produced via the `handoff` skill at session
   transition, context pressure, primary-agent switch, or a pause of more
   than a brief interruption. Updates/references the task-state file; it
   never replaces canonical project documents.

### Memory hygiene

- Never store credentials, secrets, tokens, personal data, or production
  records in agent memory or handoff files.
- Do not save transient guesses as facts.
- Every durable memory candidate needs: source, date, scope, confidence,
  invalidation condition.
- Prefer memory that points to evidence over memory that asserts
  conclusions (e.g. "Inspect ADR-014 and retry tests before changing
  acknowledgements" — acceptable; "retry is safe" — not acceptable).
- Mark stale/superseded memories explicitly.
- Compare remembered technical facts with the live repo and canonical
  docs before use.
- At the end of each completed cycle, Governor classifies each memory
  candidate as: promote to canonical documentation, retain as
  role-specific memory, update, or delete.
- Schedule periodic memory pruning; a lesson important enough to govern
  future work should usually graduate into an ADR, test, domain rule, or
  project instruction rather than remain indefinitely in private memory.

---

## Task-state file template

```markdown
# Task State: <task name>

## Objective
## User-visible success predicate
## Non-goals
## Current BDI state
### Beliefs
### Desire
### Current intention
### Uncertainties
## Architecture decisions in force
## Tickets and dependency state
## Files changed
## Evidence produced
## Reviewer findings
## Decisions still requiring user judgment
## Exact next action
## Resume instructions
```

### Required task contract (top of every nontrivial task-state file)

```markdown
## Task Contract
- Task ID:
- Risk level:
- Product outcome:
- Accepted specification:
- Non-goals:
- Canonical sources:
- Agents selected:
- Agents skipped and why:
- Skills selected and triggers:
- Required evidence:
- Rollback route:
- Stop and escalation conditions:
- Fixed diff or ticket boundary:
```

Every dispatched agent receives the same task contract. Agents may
challenge it but may not silently reinterpret it.

---

## Agent Handoff contract (returned by every subagent)

```markdown
## Agent Handoff
- Role:
- Task received:
- Sources read:
- Assumptions made:
- Work performed:
- Files changed or inspected:
- Evidence:
- Findings by severity:
- Uncertainties:
- Recommended next action:
- Memory candidates:
  - Promote to canonical docs:
  - Keep in role memory:
  - Do not retain:
```

Governor is responsible for merging these handoffs into the task-state
document.
