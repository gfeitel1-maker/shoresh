# PLATFORM_STATE.md — What Is Active Now

This is the canonical written statement of the platform's current state.
It outranks agent memory, handoff notes, and README.md when they conflict.
It does not outrank live code — if this file and the code disagree, the
code is correct and this file is stale and must be corrected.

Last reconciled: 2026-07-23 (as part of the Claude Code workflow upgrade,
branch `chore/upgrade-agent-workflow`).

## Stack in production use today

- React 19 + Vite frontend (`src/`)
- **Supabase** (Postgres + Row Level Security) for persistence and auth —
  `@supabase/supabase-js` dependency in `package.json`, client instance at
  `src/supabase.js`, RLS-scoped by `camp_id`.
- Migrations live in `supabase/migrations/`, applied manually via the
  Supabase SQL editor (see repo `CLAUDE.md`).
- No Electron shell exists in this repository. No SQLite/local-first/LAN
  sync layer exists in this repository. `package.json` has no Electron
  dependency and there is no `electron/` directory.
- Schedule engine: `src/engine/buildSchedule.js`, pure/deterministic,
  seeded PRNG, unit-tested in `src/engine/buildSchedule.test.js`.

## Known discrepancy with prior planning notes

Prior planning references (outside this repository, in the operator's
personal Claude memory) describe a "Supabase → Electron/SQLite/LAN
local-first rebuild." That rebuild is **not present in this codebase**:
no Electron dependency, no local-first data layer, no ADR approving or
recording such a move. Until an ADR is written and merged, Supabase
remains the canonical, active persistence architecture. No ADR for a
"move away from Supabase" was created during this workflow upgrade
because no such move has actually happened in the code or in any existing
canonical document — see `docs/workflow/WORKFLOW_AUDIT.md` and the
Workflow Upgrade Report for detail. If/when the local-first rebuild is
actually undertaken, Architect must produce an ADR in `docs/adr/` before
implementation begins, and this file must be updated at that time.

## In-flight, uncommitted work (not part of this upgrade)

`supabase/migrations/` has an uncommitted rename in progress (old
timestamped filenames deleted, new-format filenames added) as of this
branch. This workflow upgrade does not touch, stage, or commit those
files — they belong to separate in-progress work.
