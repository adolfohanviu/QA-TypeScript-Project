---
name: check-status-drift
description: "Trigger: status field, order status, enum drift, add status value. Grep the repo for every definition of a status/enum-like field and report agreement before it changes."
license: MIT
metadata:
  author: "portfolio-owner"
  version: "1.0"
---

## Activation Contract

Activate before adding, removing, or renaming any value of a status-like or enum-like field
(e.g. `OrderStatus`), or before trusting that such a field is single-sourced. Do not activate for
unrelated type changes.

## Hard Rules

- The canonical definition lives in exactly one place (e.g. `export type OrderStatus = ... ` in
  `src/types/index.ts`). Never add a new value as a fresh inline union/string-literal array
  elsewhere — that is exactly how this repo previously ended up with four inconsistent
  definitions of `OrderStatus` across types, mocks, and test fixtures with nothing to catch drift.
- A new value is added ONLY to the canonical type, then every consumer is updated to match it.
- Report drift even if not asked to fix it — silent disagreement is the failure mode this skill
  exists to catch.

## Decision Gates

| Finding | Action |
|---|---|
| All locations agree with canonical type | Report "no drift", proceed if a change was requested |
| A location has an inline union/array that could represent the same concept | Flag it explicitly as a drift risk, even if values currently match |
| Asked to add a new value | Add to canonical type only, then fix every consumer; never add elsewhere |

## Execution Steps

1. Identify the canonical type location for the field (start at `src/types/index.ts`).
2. Grep `src/` and `tests/` for the field name and for any inline union/string-literal array that
   could represent the same concept (mocks, fixtures, assertions, other type files).
3. Report a table: location → allowed values found there → matches canonical? (yes/no/partial).
4. If asked to add a new value: edit the canonical type only, then update every consumer location
   found in step 2 to accept/produce it, and re-run the grep to confirm no other inline union was
   left behind.

## Output Contract

A location → values → drift-status table, plus, if a change was requested, the diff summary of
the canonical type edit and every consumer file touched.

## References

- `src/types/index.ts` — canonical domain types.
- `src/mocks/handlers.ts` — mock data most likely to drift from the canonical type.
