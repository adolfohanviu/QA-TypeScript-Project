# Audit before fixing

Purpose: reality-check a repo's claims against its actual code before touching anything, so a fix
addresses a real problem instead of polishing a fiction.

## Prompt template

```
Audit this repo against its own claims before I ask you to fix anything.

Scope: {README.md / CI workflows / package.json scripts / a specific directory}

Do NOT fix anything yet. Report only:
1. Every claim in {README.md / CI config} that isn't backed by real, runnable code
   (e.g. a script referenced but not defined, a CI step that can't actually fail,
   a feature described but never implemented).
2. Any error-handling that could be silently swallowing a real failure
   (broad try/catch, continue-on-error, .catch(() => {}), optional chaining that
   hides a missing dependency).
3. Any place the same concept (a type, an enum, a config value) is defined more
   than once, and whether the definitions actually agree.
4. Any config file that exists but is never invoked by the scripts/CI that claim
   to use it.
5. Concrete, file-and-line-referenced opportunities — not generic advice.

Give me a punch list ordered by how much it undermines trust in the test suite,
not by how easy each item is to fix.
```

## Why this works

This is the exact shape of prompt that surfaced this repo's real defects: a CI pipeline with
`continue-on-error: true` on every step (including the test run itself) and `package.json`
scripts referenced in workflows that didn't exist anywhere (`test:visual`, `test:a11y`,
`test:performance`, `test:unit`) — a pipeline that could never fail and tested capabilities that
were never built. The same style of prompt, pointed at `src/mocks`, is what found a `try/catch`
silently swallowing a `SyntaxError` from a dynamic MSW import — mocking never activated, and the
API tests had been hitting the real network the whole time, "passing" by coincidence. Asking for
a fix-it list up front tends to produce confident-sounding patches for problems that were never
verified to exist; asking for an audit first, with the fix explicitly deferred, produces a list
you can independently check against the code before any line changes.
