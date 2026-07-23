# Workflow Audit (Part 11 — Adversarial Review of the Upgrade Brief)

Performed before finalizing the structural artifacts (agent files,
workflow doc, templates) that depend on this audit's conclusions. Each
perspective below was reasoned independently — i.e. written without
reference to the others' conclusions — before the cross-cutting synthesis
at the end. This is a paper/reasoned audit by one agent adopting five
lenses in sequence with no cross-referencing until the synthesis section,
not five independently-run subagents; that limitation is itself flagged
below (Portability/Human-factors overlap).

---

## 1. Minimalist perspective

Where does the workflow add ceremony without proportional evidence?

- The 10-role team plus Grader plus ADHD is a lot of surface for a
  1-developer-adjacent, single-repo project (Shoresh). The routing table
  mitigates this on paper, but nothing in the brief *forces* Governor to
  actually pick the small route in practice — it's a written policy, not
  a mechanical gate.
- The four-part memory architecture (canonical/agent/task-state/handoff)
  is more structure than a small team needs for trivial changes. The
  brief does scope this ("Task Contract... at the top of every
  **nontrivial**" file) which is the right mitigation.
- `docs/workflow/architecture-reports/` was created but nothing in the
  brief defines what goes there beyond Architect's "scheduled structural
  audits" — this could sit empty indefinitely. Acceptable as scaffolding,
  but worth flagging as ceremony risk if never used.
- WORKFLOW_METRICS.md is itself Part-11-flagged ceremony risk: a metrics
  table nobody reads back is process theater. Mitigated only if Governor
  actually revisits it periodically (brief says "use periodically" but
  has no forcing function).

**Verdict:** Accept the structure but do not pre-populate ADRs, tickets,
or specs for the sake of completeness. Reject the idea of running the
full role roster as a default for this repo's actual scale.

## 2. Reliability engineer perspective

Where can false PASS, data loss, race conditions, flaky checks, or
untested recovery survive?

- Verifier's "Electron startup or relevant runtime smoke test" is
  moot for this repo (no Electron shell exists) — if Verifier profiles
  aren't updated when/if an Electron shell is added, this gate could be
  silently skipped and it would read as N/A rather than a genuine gap.
  Addressed in `verifier.md` by naming the actual current runtime check
  (`npm run dev` reachability) instead of a boilerplate Electron line.
- No CI is configured in this repo (no `.github/workflows` observed).
  Verifier's gates are only as good as whoever remembers to run them
  locally — nothing enforces that Verifier's report reflects a real run
  vs. a plausible-looking fabrication. This is the single biggest
  reliability gap: **the workflow depends on agent honesty for gate
  execution, with no independent mechanical check.**
- Grader's "cannot average away blockers" rule is good on paper but is
  itself just an instruction to an LLM — nothing prevents a future Grader
  invocation from summarizing a blocker as a minor note. Mitigation:
  Grader profile lists absolute blockers explicitly and makes disposition
  primary/scores secondary, which is the best available mitigation
  short of a hard-coded gate.

**Verdict:** Accept Verifier/Grader wording as the best available
mitigation. Record as a known, accepted limitation (not fixable by this
upgrade alone) that gate execution is not mechanically enforced outside
the agent's own reported evidence — see "Remaining limitations" in the
final report.

## 3. Security and supply-chain reviewer perspective

- Matt Pocock skills and the ADHD skill were installed by cloning
  third-party GitHub repos via `npx skills@latest` and copying files
  into `~/.claude/skills/`. This is a real supply-chain surface: any
  future update to those upstream repos changes agent behavior without
  an explicit review step in this repo. Per Part 12, this must be
  recorded (`docs/workflow/TOOLING.md`) with the installed commit state,
  and updates must be a deliberate re-run, not automatic (the
  `npx skills@latest add` installer *copies* files rather than linking a
  live plugin feed, so no auto-update risk was found for this specific
  install path — confirmed by re-reading its output, which says
  "(copied)" for every skill).
- `~/.claude/settings.json` (pre-existing, not created by this task) has
  a plaintext `OPENAI_API_KEY` in `env`. This predates the workflow
  upgrade and is out of scope to fix silently, but it is a real
  credential-in-config risk worth flagging to the user directly (not
  silently left as-is without mention).
- Skill instructions are, per Part 12 rule 9, to be treated as
  instructions to evaluate, not trusted executable truth — this is
  stated in `docs/workflow/TOOLING.md` (created below) and should be
  restated in Governor's operating notes.
- No agent profile grants `bypassPermissions`; read-only reviewers
  (Designer, Architect, Code Reviewer, Tester, Security, Red Hat, Grader)
  all use `permissionMode: plan`. Verified directly in each `.claude/
  agents/*.md` file created in this task.

**Verdict:** Accept: record installed skill state in TOOLING.md, flag
the pre-existing plaintext API key to the user (see final report), keep
`plan` mode for all read-only roles. Reject: no action taken on the
API key beyond flagging — rotating/removing credentials was not
requested and touching `settings.json`'s `env` block is out of scope for
a documentation/agent-config upgrade.

## 4. Human-factors reviewer perspective

- The routing table and BDI sections are dense, engineer-facing prose.
  For a non-developer product owner, the actually load-bearing output is
  Grader's disposition and Governor's plain-language recommendation —
  the brief already protects this via Operating Principle 7 and the
  global CLAUDE.md block ("do not make me select among technical options
  without a recommendation"). No structural change is needed; the risk
  is future-agent drift away from that discipline, which is a training/
  compliance risk, not a document defect.
- Five possible reviewer reports plus a Verifier report plus a Grader
  report is a lot of paper for a user to receive if Governor forwards all
  of it. Mitigation: Governor's role is to translate, not forward
  verbatim — this should be stated explicitly rather than assumed.
  **Accepted correction:** added an explicit line to `WORKFLOW.md`/
  Governor profile intent that Governor's user-facing output is a
  translated recommendation, not a dump of every agent report.
- No agent report format currently declares "confidence" in a
  user-legible way except Grader. Tester/Security/Red Hat findings could
  read as more authoritative than they are, to a nontechnical reader.
  This is mitigated by Governor's translation duty (previous point).

**Verdict:** Accept the addition of an explicit "Governor translates,
does not forward raw reports" instruction (added to `governor.md` desire/
intention). Reject inventing a new "user-facing summary" agent role — the
existing Governor role is sufficient per Part 5's "do not add more roles
without evidence of a distinct gap."

## 5. Portability reviewer perspective

Which instructions are Shoresh-specific, tool-version-specific, OS-
specific, or likely to break in another project?

- `verifier.md`'s discovered gates reference `npm run build`, `npm run
  lint`, `npm test` — these are Shoresh's actual `package.json` scripts,
  correctly project-specific (per Part 12 rule 2, discovered rather than
  invented). Portable version of this file for a new project must
  rediscover its own scripts; noted in `~/.claude/CLAUDE.md`'s bootstrap
  block (Part 8), which already instructs "Validate every agent against
  the new stack and commands."
- The `claude plugin marketplace add mattpocock/skills` / `claude plugin
  install` commands specified in Part 2.1 **did not work in this
  execution environment** — the `claude` CLI binary was not on `PATH` in
  the available shell (`claude: command not found`). The working
  fallback (`npx skills@latest add mattpocock/skills -a claude-code -g`)
  is itself dependent on `npx` and internet access to GitHub, and is
  version-pinned only implicitly (whatever HEAD of `mattpocock/skills`
  existed at install time — recorded in TOOLING.md). This is a real
  portability/reproducibility gap: **a different machine with the
  `claude` CLI on PATH might succeed via the documented plugin path and
  get a different (managed, auto-updating) installation shape than this
  one (static file copy).** Both are legitimate per the brief's own
  fallback language ("If the installer does not recognize the target
  name, run... and select"), but the two install paths are not
  equivalent long-term (plugin = potentially auto-updating; skills copy
  = static until re-run).
- macOS-specific backup commands (already executed, out of scope to
  redo) and Windows-equivalent commands are both present in the brief —
  no action needed, this was already portable.
- Agent frontmatter fields (`model`, `memory`, `effort`, `permissionMode`,
  `skills`) are Claude-Code-version-dependent; if a future Claude Code
  release renames or removes any of these keys, all ten agent files need
  a mechanical pass. No mitigation beyond noting it in TOOLING.md.

**Verdict:** Accept: record both the failed plugin-CLI path and the
working npx-skills path in TOOLING.md and the final report, explicitly
so a future user on a machine with the `claude` CLI available knows to
prefer the documented plugin path if they want auto-updating behavior.
Reject: do not attempt to fake a plugin-marketplace installation state
that wasn't achieved.

---

## Cross-cutting synthesis (post hoc clustering, after all five above were written)

### Accepted corrections (applied)

0. **`.gitignore` ignored the entire `.claude/` directory**, which would
   have silently prevented `.claude/agents/*.md` (the canonical
   executable subagent location per Part 5) from ever being committed —
   a direct contradiction between the brief's instruction to make
   `.claude/agents/` canonical and this repo's existing ignore rule.
   Fixed by scoping the ignore to `.claude/*` with `!.claude/agents/`
   and `!.claude/agents/**` negations, so agent profiles are tracked
   while other `.claude/` local state (worktrees, sessions, settings)
   stays ignored. *(reliability + minimalist: an untracked "canonical"
   file is worse than ceremony — it's a false sense of durability.)*
1. Verifier's runtime-smoke-check line names the actual current check
   (`npm run dev` reachability) instead of a generic "Electron startup"
   line that would silently read as N/A. *(reliability)*
2. Governor's profile states explicitly that it translates reports into
   a plain-language recommendation rather than forwarding raw reviewer
   output to the user. *(human-factors)*
3. `docs/workflow/TOOLING.md` records both the failed `claude plugin`
   path and the working `npx skills@latest` path, plus the fact that the
   npx path is a static copy, not an auto-updating managed plugin.
   *(portability, security/supply-chain)*
4. The pre-existing plaintext `OPENAI_API_KEY` in `~/.claude/
   settings.json` is flagged to the user in the final report rather than
   silently ignored or silently "fixed" without permission.
   *(security/supply-chain)*
5. No ADR was fabricated for a Supabase-to-local-first move that has not
   actually happened in code; `PLATFORM_STATE.md` records this
   explicitly instead. *(minimalist + reliability: do not create
   evidence-free architecture documents)*

### Rejected suggestions (recorded so they are not re-proposed)

1. **"Add a mechanical CI gate so Verifier can't fabricate results."**
   Rejected for this task: out of scope (no CI exists in this repo yet;
   adding CI is an implementation change requiring its own
   spec/ticket/Architect involvement, not a docs/agent-config upgrade).
   Recorded as an accepted **limitation** instead, not fixed silently.
2. **"Add an eleventh 'User Liaison' role to handle report translation."**
   Rejected — Part 5 explicitly forbids adding roles without evidence of
   a distinct gap; Governor already owns user-facing translation per
   Operating Principle 7.
3. **"Rotate/remove the OPENAI_API_KEY from settings.json as part of this
   upgrade."** Rejected — out of scope and not requested; flagging to the
   user is sufficient and safer than an unrequested credential change.
4. **"Pre-populate docs/workflow/architecture-reports/ with a template
   file so it isn't empty."** Rejected — creating a template with no real
   content is exactly the ceremony-without-evidence pattern the
   minimalist lens flags; leave the directory to be populated when
   Architect actually produces a report.
5. **"Require every task, including trivial ones, to fill out the full
   Task Contract."** Rejected — the brief itself scopes the contract to
   nontrivial tasks and allows Governor to skip full spec/ticketing for
   truly trivial, reversible changes; over-applying the contract is the
   ceremony risk the Minimalist lens flags.

### Explicit failure-mode checks required by Part 11

| Failure mode | Status after this audit |
|---|---|
| All agents invoked by habit | Mitigated by explicit routing table + `ROUTING CHALLENGE` mechanism in `governor.md`; not mechanically enforced, accepted limitation. |
| Grader averaging away a blocker | Mitigated — `grader.md` lists absolute blockers and makes disposition primary. |
| Reviewers influencing one another | Mitigated — `WORKFLOW.md` Phase 8 and each reviewer profile state independence explicitly; not mechanically enforced (an operator could paste one report into another's prompt) — accepted limitation. |
| Stale agent memory overruling live code | Mitigated — Operating Principle 15 + every agent's Belief section states canonical docs/live code outrank memory. |
| Global skill updates changing behavior silently | Partially mitigated — TOOLING.md records install state; no update-detection mechanism exists. Accepted limitation. |
| Skill-name/command drift between repo versions | Mitigated for this install — actual installed names verified against `~/.claude/skills/` listing (see TOOLING.md); future drift is an accepted limitation. |
| Read-only reviewer accidentally editing files | Mitigated — all reviewer profiles set `permissionMode: plan`. |
| Parallel agents writing to the same worktree | Mitigated — `WORKFLOW.md` Phase 8 states reviewers are read-only and must not edit the same working tree; worktree isolation named in Part 12 rule 5. |
| Tests confirming implementation rather than spec | Mitigated — Maker's TDD instruction requires the failing test to precede implementation and be recorded; Code Reviewer's Spec axis exists specifically to catch this. |
| Passing mocked tests while real runtime is broken | Mitigated — Verifier requires a runtime smoke test distinct from unit tests (see correction #1 above). |
| Incomplete verification interpreted as PASS | Mitigated — `verifier.md` explicitly requires `INCOMPLETE` verdict when required evidence is missing, never PASS. |
| Task-state files accumulating secrets/obsolete assumptions | Mitigated — memory hygiene section in `docs/workflow/handoffs/TEMPLATE.md` explicitly forbids secrets and requires marking stale memories. |
| Architecture work expanding a small feature unnecessarily | Mitigated — routing table scopes Architect involvement to core-structure-impacting work only. |
| User asked to arbitrate low-level choices without a recommendation | Mitigated — Operating Principle 7 + global `~/.claude/CLAUDE.md` block. |
| Governor as unchallenged single point of failure | Mitigated — `ROUTING CHALLENGE` mechanism lets any agent challenge Governor's routing; Governor must resolve it in the task-state file. |
| BDI sections becoming decorative | Mitigated for the ten profiles created in this task — each has a real Stop condition and Uncertainty instruction, not boilerplate. Future drift is an accepted risk if profiles are edited carelessly. |
| Agent consensus treated as independent proof | Mitigated — Operating Principle 12 + Grader's evidence-over-consensus rule. |
| Truths trapped in private memory instead of promoted | Mitigated — memory hygiene section requires periodic promotion classification. |
| Every finding routed back to Maker regardless of cause | Mitigated — `WORKFLOW.md` "Required backward paths" table explicitly routes by cause. |

**Overall disposition of this audit:** proceed with the structural
upgrade as corrected above. The single largest unresolved limitation is
that gate execution (Verifier) and reviewer independence are enforced by
written instruction, not by a mechanical harness — this is disclosed as
a known limitation in the final Workflow Upgrade Report rather than
presented as solved.
