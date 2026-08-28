# Scaffold a new e2e flow

Purpose: add a new Page Object + matching `tests/e2e` spec pair that follows this repo's exact
conventions, with selector verification enforced before any code is generated. Pairs with the
`scaffold-page-object` skill.

## Prompt template

```
Add a new Page Object and matching e2e spec for {page/flow name} in this repo.

Requirements, in order:
1. Identify the real URL/state on https://www.saucedemo.com for this page — don't
   assume a path, confirm it.
2. Drive that page in a real browser and extract its actual data-test/class
   selectors for every element the new methods will touch. List each one and how
   you confirmed it. Do not invent any.
3. Generate src/pages/{Name}Page.ts extending BasePage, using only the inherited
   Locator-based helpers (this.click, this.fillText, this.getText, this.isVisible,
   ...) — no page.$, $eval, $$eval, or waitUntil: 'networkidle'.
4. Generate tests/e2e/{name}.spec.ts matching the existing convention: import the
   page object via the @/pages/... alias, log in via LoginPage in a
   test.beforeEach, tag tests with the typed { tag: ['@smoke'] } / { tag:
   ['@regression'] } option (this is Playwright's tagging mechanism — it is NOT
   the same as Jest's name-substring tags used in tests/api), and structure each
   test body with // @arrange / // @act / // @assert comments.
5. Run `npx playwright test --list` and show me the output confirming the new
   spec resolves before you call this done.

If any selector can't be confirmed live, stop and tell me which one instead of
guessing.
```

## Why this works

This template exists because this repo's own e2e suite was built once without steps 1–2 and
without step 5 as a gate, and the result was a framework that looked complete but was built
against a domain (`example.com`) and selectors that never existed on the real app — it had never
actually run. Making selector verification and a `--list` resolution check mandatory,
non-skippable parts of the scaffolding prompt (rather than something to check afterward) is what
turns "generate code that looks right" into "generate code that is checked against the real
target before it's considered finished."
