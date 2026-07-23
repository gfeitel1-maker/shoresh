# CONTEXT.md — Domain Language and Durable Product Concepts

This file defines Shoresh's domain vocabulary. It is canonical: agent memory and
handoff notes may reference it but may not override it. Update it when domain
language changes, not when implementation details change (those belong in
`PLATFORM_STATE.md`).

## Product

Shoresh is the adaptive scheduling layer for camps: a constraint-satisfaction
engine for building camp schedules, with human override, locking, and
snapshots on top.

## Domain terms

- **Camp** — a tenant. All data is isolated per camp via Supabase Row Level
  Security (RLS), scoped by `camp_id`.
- **Group** — a cohort of campers that moves through the schedule together.
- **Tier** — an age/level grouping that constrains which activities a group
  is eligible for.
- **Time block** — a scheduling slot within a day (e.g. "Period 3").
- **Activity** — a schedulable unit with location capacity and eligibility
  rules.
- **Anchor** — an activity placement that cannot move during generation
  (e.g. a fixed all-camp event).
- **Slot** — the atomic unit of the schedule: one group, in one time block,
  on one day, assigned to one activity (or flagged unfillable).
- **Flag** — a surfaced problem the engine could not resolve automatically
  (unfillable slot, underserved activity, distribution gap, weather risk).
- **Lock** — a user decision on a slot that must survive regeneration.
- **Snapshot** — a named, saved version of a schedule, auto-created before
  every regeneration.
- **Schedule engine** (`src/engine/buildSchedule.js`) — the pure, seeded,
  deterministic function that produces slots + flags from
  groups/tiers/days/timeBlocks/activities/anchors/campId/preplacedSlots.

## Architecture notes for this document (not implementation authority)

- Current persistence and auth layer is **Supabase** (Postgres + RLS), via
  `@supabase/supabase-js` and `src/supabase.js`. There is no Electron app and
  no local-first/SQLite layer in the live codebase as of this writing — see
  `PLATFORM_STATE.md` for the authoritative current-state statement and
  `docs/adr/` for any approved future direction.
- Authoritative precedence for resolving contradictions is defined in
  `CLAUDE.md`.
