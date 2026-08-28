# Verify before hardcoding

Purpose: confirm a selector or behavior against the real, live target application in a browser
before writing a single line of Page Object or test code against it.

## Prompt template

```
Before writing any selector for {page/component name}, drive the real app and verify
first:

1. Open {https://target-app.example.com/path} in an actual browser (or an automated
   browser tool with page inspection).
2. For each element I need to interact with ({list the elements/actions}), find its
   real attribute — prefer data-test/data-testid, then a stable id, then a class
   that isn't dynamically generated. Quote the exact attribute value you observed,
   not a guessed one.
3. If an element has no stable test attribute, tell me that explicitly instead of
   inventing one — I'd rather add a real attribute to the app (if I control it) or
   pick a less fragile selector than ship a guess.
4. Only after every selector is confirmed live, write the Page Object method(s)
   using those exact values.

Do not write selector strings from memory, from similar apps you've seen, or from
what a naming convention "should" produce.
```

## Why this works

This is the single most expensive mistake in this repo's history: half of the original E2E suite
(`ShoppingPage`, the old `CartPage`/`CheckoutPage`) was written entirely against a fictional
`https://example.com` domain with invented `data-testid` selectors — a complete-looking framework
that had never actually run against anything real. It was only caught and fixed by going back and
driving the real target (`saucedemo.com`) in a browser and extracting its actual `data-test`
attributes before rewriting a single selector. An LLM will happily produce plausible-looking
selectors from pattern-matching on similar apps it has seen in training; nothing about that output
signals "unverified." Forcing the verification step into the prompt, before code generation, is
the only way to stop a fluent guess from becoming a permanent fixture in the codebase.
