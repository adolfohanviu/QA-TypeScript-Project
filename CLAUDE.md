# CLAUDE.md

`AGENTS.md` (repo root) is the canonical instruction file for this repo. Read it first, in full,
before making any change — it covers the two test layers and their tagging mechanisms, the Page
Object and selector rules, the domain-type rule, the MSW version pin, the no-theater rule, and the
definition of done. This file does not repeat that content; it only adds what's specific to
running as Claude Code here.

## Claude-Code-specific notes

- The three project skills listed in `AGENTS.md` (`scaffold-page-object`, `check-status-drift`,
  `generate-contract-test`) live under `.claude/skills/` and are invokable directly via the
  `Skill` tool — match them by task (new page object, status/enum field, contract test), not by
  waiting for the user to name them.
- The prompt templates under `prompts/` are meant to be pasted as-is (with `{placeholders}`
  filled in) when starting the corresponding kind of task; prefer reusing them over writing a
  fresh ad hoc prompt.
