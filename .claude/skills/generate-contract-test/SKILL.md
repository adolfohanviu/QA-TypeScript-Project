---
name: generate-contract-test
description: "Trigger: contract test, API contract, zod schema test, new endpoint test. Generate a zod-schema-validated @contract Jest test from the real MSW handler shape."
license: MIT
metadata:
  author: "portfolio-owner"
  version: "1.0"
---

## Activation Contract

Activate when asked to add or strengthen a contract test for an API endpoint. Existing
`@contract`-tagged tests in `tests/api/*.spec.ts` only do shallow `toHaveProperty`/`typeof`
checks — this skill is what makes the `test:contract` script's promise real by using `zod`
(already a dependency, currently only used in `src/utils/config.ts`) for actual schema
validation.

## Hard Rules

- The schema must be derived from the real MSW handler response in `src/mocks/handlers.ts`, not
  from the type definition alone — the handler is the actual contract under test.
- The test must be Jest, tagged `@contract` in the `describe`/`it` name string (Jest tags are
  name-substrings, matched via `--testNamePattern`, NOT Playwright's `{ tag: [...] }` option).
- Validate with `schema.parse()` or `safeParse()` against the real response from `apiClient` —
  never hand-roll the same checks the schema already encodes.

## Decision Gates

| Condition | Action |
|---|---|
| A `zod` schema for this shape already exists under `src/types/` or `tests/api/` | Reuse/extend it, don't duplicate |
| Handler response shape has optional fields | Model with `.optional()`, don't widen to `any` |
| Endpoint has multiple response variants (e.g. 404 vs 200) | Add a schema/test per variant |

## Execution Steps

1. Read the target MSW handler in `src/mocks/handlers.ts` to see the real response shape.
2. Define a `zod` schema matching it, colocated under `tests/api/` (next to the spec that will
   use it) or `src/types/` if it's reusable across suites — match whichever convention the
   nearest existing file uses.
3. Write a `@contract`-tagged Jest test that fetches via `createApiClient`/`ApiClient` and parses
   the response through `schema.parse()`/`safeParse()`, asserting success (and failure shape for
   `safeParse()` if invalid input is also tested).
4. Run `npm run test:api` (or `npm run test:contract` to scope to `@contract` only) and confirm
   it passes before considering the task done.

## Output Contract

Report: the endpoint covered, the schema file path, the test file path, and the
`npm run test:contract` result confirming it passes.

## References

- `assets/contract-test.template.ts` — skeleton zod schema + `@contract` Jest test.
- `src/mocks/handlers.ts` — source of truth for real response shapes.
