# AGENTS.md

Canonical, tool-agnostic instruction file for any AI agent (Claude Code, Cursor, Copilot, etc.)
working in this repo. Read this file in full before touching `src/`, `tests/`, CI config, or
`package.json` scripts. If another agent-instruction file exists (e.g. `CLAUDE.md`), it points
back here — this is the source of truth.

## Repo shape

- `src/pages/*.ts` — Page Objects for the real https://www.saucedemo.com app, all extending `BasePage`.
- `tests/e2e/*.spec.ts` — native `@playwright/test` specs, run via `npm run test:e2e`.
- `src/mocks/handlers.ts`, `src/mocks/server.ts` — MSW v2 mock layer for the API suite.
- `tests/api/*.spec.ts` — Jest specs against `createApiClient`, mocked via MSW, run via `npm run test:api`.
- `src/types/index.ts` — canonical domain types (`Order`, `OrderStatus`, `Product`, `User`, ...).

## Two test layers — do not confuse them

This repo has two independent runners with two independent tagging mechanisms. They are NOT
interchangeable and a filter written for one does nothing on the other.

| | Playwright (`tests/e2e`) | Jest (`tests/api`) |
|---|---|---|
| Runner | `playwright test` (uses `playwright.config.ts`) | `jest` (uses `jest.config.ts`) |
| Tagging | typed option: `test('...', { tag: ['@smoke'] }, async () => {...})` | substring in the `describe`/`it` name: `describe('@smoke ...', ...)` |
| Filter flag | `playwright test --grep @smoke` | `jest --testNamePattern='@smoke'` |
| Run one layer | `npm run test:e2e` | `npm run test:api` |
| Run both, same tag | `npm run test:smoke` / `npm run test:regression` (runs Jest AND Playwright in sequence, one tag) | |

Never add a `{ tag: [...] }` option to a Jest test, and never expect `--grep` to do anything to a
Jest describe block. If you add a new tag, add it to both the Jest name string and the Playwright
`tag` array where the same logical suite exists on both sides.

## Page Object rules

- Every page object extends `BasePage` (`src/pages/BasePage.ts`). Add new low-level interactions
  there only if multiple pages need them; keep page-specific logic in the subclass.
- `BasePage` methods are all `Locator`-based internally (`this.page.locator(selector)...`). Never
  add or call `page.$`, `page.$$`, `$eval`, `$$eval`, or pass `waitUntil: 'networkidle'` anywhere.
  Those APIs do not auto-wait/auto-retry the way `Locator` does, and this repo has already paid
  the cost of that gap once (see Lesson 1 below) — a selector or timing assumption that looks
  fine in isolation can pass locally and be silently wrong against the real app.

## Selector rule — verify before you write

Before adding any new selector to a page object, confirm it exists on the real running app first
(browser devtools inspection, or an automated browser check). Never invent a `data-test` /
`data-testid` value by guessing from a naming convention.

**Why this is non-negotiable:** half of this repo's original E2E suite (`ShoppingPage`, the old
`CartPage`/`CheckoutPage`) was built entirely against a fictional `https://example.com` domain
with invented `data-test` attributes that matched nothing real. It looked like a complete,
working framework and had never actually run. It was only fixed by driving the real
saucedemo.com app in a browser and extracting its actual `data-test` attributes before writing a
single selector — that is now how every selector in `src/pages/*.ts` was produced (e.g. the
per-product `add-to-cart-{slug}` / `remove-{slug}` selectors in `ProductsPage.ts`/`CartPage.ts`
are derived from the real slugified product name, not guessed).

## Domain-type rule

One canonical type per concept, defined once in `src/types/index.ts`, imported everywhere else
(`import type { OrderStatus } from '@/types/index'` / `'../types/index'`). Never redeclare an
inline union or ad hoc string-literal array for the same concept in a mock, a test fixture, or an
assertion.

**Why:** `OrderStatus` used to have four different, mutually-inconsistent definitions scattered
across types, mocks, and test fixtures, and nothing enforced agreement — drift went unnoticed
until it was audited. If you need to check whether a status-like field is still single-sourced,
use the `check-status-drift` skill before changing it.

## MSW rule

- API mocking is MSW **v2** only: `http` and `HttpResponse` from `'msw'`. Never `rest` (v1 API).
- `msw` is deliberately pinned to `^2.10.0` in `package.json`. Before bumping it, check the
  changelog for ESM-only dependency changes — a newer 2.x once pulled in an ESM-only transitive
  dependency incompatible with this project's Jest/ts-jest CJS pipeline, which silently broke
  mocking (see Lesson 3). If you must bump it, run `npm run test:api` and confirm the MSW
  `beforeAll`/`server.listen()` path in `tests/setup.ts` still intercepts requests — don't just
  trust that tests go green.

## No-theater rule

Never add a CI step, npm script, or config entry for a capability that is not actually
implemented. No visual-regression, accessibility, performance, or contract-schema step unless
real code backs it. Never mask a failing step with `continue-on-error: true` (or any other
suppression) on anything that should signal real failure.

**Why:** this repo's CI previously ran every step (including the actual test run) with
`continue-on-error: true`, and its `package.json` referenced `test:visual`, `test:a11y`,
`test:performance`, `test:unit`, and similar scripts that did not exist. The pipeline could never
fail and tested capabilities that were never built. If you add a new script or CI step, it must
be runnable and must be allowed to fail the build.

## Definition of done

For any change, all of the following must pass — no exceptions, no "fix the pipeline later":

```
npm run type-check && npm run lint && npm run test:api && npm run test:e2e -- --project=chromium
```

## Skills

Three project skills live under `.claude/skills/`. Reach for them by task, not by name-matching:

- **scaffold-page-object** — new page object, POM, "scaffold a page", "add a page for X". Drives
  the real app first, extracts real selectors, then generates a `BasePage`-extending class and a
  matching `tests/e2e/*.spec.ts`.
- **check-status-drift** — before adding/changing any status-like or enum-like field ("order
  status", "add a new status value"). Greps the whole repo for every place the field's allowed
  values are defined and reports agreement/drift before you touch anything.
- **generate-contract-test** — "contract test", "API contract", "zod schema test", "new endpoint
  test". Generates a real `zod`-schema-validated `@contract`-tagged Jest test from the actual MSW
  handler shape, replacing shallow `toHaveProperty`/`typeof` checks with real schema validation.

## Prompts

`prompts/` holds reusable, copy-paste prompt templates that document how this repo's real
audit-and-repair work was actually done — not generic prompting advice. Use
`prompts/audit-before-fixing.md` before trusting any README/CI claim, use
`prompts/verify-before-hardcoding.md` before writing any new selector, and use
`prompts/scaffold-new-e2e-flow.md` as the driving prompt behind the `scaffold-page-object` skill.
