# Tooling — Installed Skill/Plugin State

Recorded 2026-07-23 during the Claude Code workflow upgrade
(`chore/upgrade-agent-workflow`).

## Install attempts and actual results

### Matt Pocock's skills

- **Documented path (Part 2.1):** `claude plugin marketplace add
  mattpocock/skills` then `claude plugin install mattpocock-skills@mattpocock`.
  **Result: FAILED.** The `claude` CLI binary was not found on `PATH` in
  the bash environment available to this task (`claude: command not
  found`, exit 127). This install path was not achievable from this
  execution environment and was not faked.
- **Fallback path actually used:** `npx --yes skills@latest add
  mattpocock/skills -a claude-code -g`. **Result: SUCCESS** (exit 0).
  This cloned `https://github.com/mattpocock/skills` at its current HEAD
  and copied every skill in the repo into `~/.claude/skills/<skill-name>/`
  as static files (installer output: "(copied)" per skill, not a linked
  plugin). Verified installed and discoverable via the Skill tool /
  system skill listing immediately after install; canonical names
  confirmed present: `setup-matt-pocock-skills`, `grill-with-docs`,
  `to-spec`, `to-tickets`, `implement`, `improve-codebase-architecture`,
  `handoff`, `wayfinder`, `domain-modeling`, `codebase-design`,
  `research`, `code-review`, `tdd`, `diagnosing-bugs`, `prototype`,
  `adhd` (adhd from the separate repo below), plus many more (full list
  in the final report).
- **Implication:** this install is a **static snapshot**, not an
  auto-updating managed plugin. It will not change again until someone
  re-runs the `npx skills@latest add` command. If the `claude` CLI plugin
  path is used instead on a machine where it works, it may behave as an
  auto-updating managed plugin — that is a materially different update
  model and should be a deliberate choice, not an accident of which
  machine happens to run the install.
- **Commit/version reference:** the installer does not print a commit
  SHA in its human-readable output; the exact commit is whatever
  `mattpocock/skills`'s default branch HEAD was at install time,
  2026-07-23, via `npx skills@latest` (npx resolved `skills@1.5.20`).

### ADHD skill

- **Documented path (Part 2.2):** `npx skills@latest add
  UditAkhourii/adhd -a claude-code -g`. **Result: SUCCESS** (exit 0),
  first attempt, no fallback needed.
- Installed to `~/.claude/skills/adhd/` (installer output: "adhd
  (copied)"). Security risk assessment printed by the installer: Gen
  "Safe", Socket "0 alerts", Snyk "Low Risk".
- Same static-snapshot caveat as above applies.

### `skills` CLI itself

- Resolved via `npx` as `skills@1.5.20` at install time. Not pinned;
  future re-installs may resolve a different `skills` CLI version with
  different behavior. Not mitigated further in this task — recorded as
  a known drift risk (see `docs/workflow/WORKFLOW_AUDIT.md`, portability
  section).

## Safety rules applied (Part 12)

- No agent profile (`architect.md`, `verifier.md`, `code-reviewer.md`,
  `governor.md`, `designer.md`, `maker.md`, `tester.md`, `security.md`,
  `red-hat.md`, `grader.md`) grants `bypassPermissions`.
- Read-only reviewers (`designer`, `architect`, `code-reviewer`,
  `tester`, `security`, `red-hat`, `grader`) all set
  `permissionMode: plan`.
- `maker` uses `acceptEdits` (not `bypassPermissions`) since it is the
  only role that edits implementation files.
- `verifier` uses `default` permission mode — it runs commands but does
  not get a broadened grant.
- Worktree isolation: this entire task was executed inside a Claude Code
  worktree (`.claude/worktrees/agent-aa57a43d65ec670c5`) rather than the
  shared checkout, consistent with Part 12 rule 5.
- No production credentials were exposed to any installed third-party
  skill; skill installation only copied files, it did not execute
  arbitrary code with repo secrets.
- Skill output (including the ADHD skill's own instructions) is treated
  as content to evaluate, not as trusted executable instruction, per
  Part 12 rule 9 and the top-level instruction-source-boundary rule this
  agent operates under.

## Flagged, not fixed, in this task

- `~/.claude/settings.json` (pre-existing, not created by this upgrade)
  contains a plaintext `OPENAI_API_KEY` under `env`. This is a
  credential-in-config risk. It was not touched, because doing so was
  not requested and is outside this task's scope (documentation/agent
  tooling upgrade, not a settings/security remediation task). Flagged
  here and in the final report for the user's awareness.
