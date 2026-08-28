---
name: scaffold-page-object
description: "Trigger: new page object, POM, scaffold page, add page. Generate a Playwright Page Object and matching tests/e2e spec using only verified real selectors."
license: MIT
metadata:
  author: "portfolio-owner"
  version: "1.0"
---

## Activation Contract

Activate when asked to add a new page object, POM, or e2e flow for a page not yet covered under
`src/pages/`. Do not activate for edits to an existing page object's methods only.

## Hard Rules

- Never invent a `data-test`/`data-testid` selector. Every selector must be confirmed against the
  real running app first — this repo's original E2E suite was built entirely against a fictional
  domain with invented selectors that matched nothing, and never actually ran.
- The new class MUST extend `BasePage` and use only `Locator`-based calls (`this.page.locator(...)`
  via the inherited helpers). Never `page.$`, `page.$$`, `$eval`, `$$eval`, `waitUntil: 'networkidle'`.
- The matching spec goes in `tests/e2e/`, imports the page object via the `@/pages/...` alias, and
  uses a `test.beforeEach` login plus `// @arrange` / `// @act` / `// @assert` comments.

## Decision Gates

| Condition | Action |
|---|---|
| Target page not reachable without login | beforeEach must log in via `LoginPage` first |
| Selector can't be confirmed live (no browser access) | STOP and report which selectors are unverified — do not guess |
| Page needs a helper shared by other pages | add it to `BasePage`, not the subclass |

## Execution Steps

1. Identify the real target page/URL on the live app (`https://www.saucedemo.com/...`).
2. Drive it in an actual browser (or automated browser check) and extract real `data-test`/class
   selectors from the live DOM. Never proceed on assumed selector names.
3. Generate the Page Object class from `assets/page-object.template.ts`, extending `BasePage`,
   using only the verified selectors, Locator-based calls only.
4. Generate the matching spec from `assets/spec.template.ts` with a login `beforeEach` and
   `@arrange`/`@act`/`@assert` comment structure.
5. Run `npx playwright test --list` and confirm the new spec resolves with no errors before
   considering the task done.

## Output Contract

Report: the new page object file path, the new spec file path, the selectors used and how each
was verified (not assumed), and the `playwright test --list` output confirming resolution.

## References

- `assets/page-object.template.ts` — skeleton Page Object matching current `BasePage` conventions.
- `assets/spec.template.ts` — skeleton e2e spec matching current login/tag/comment conventions.
