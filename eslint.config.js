// @ts-check
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

/**
 * Flat ESLint config (ESLint 9+/10+; this file is loaded as ESM because
 * package.json sets "type": "module").
 *
 * Type-aware linting (`recommended-type-checked`) was considered but skipped:
 * this repo has no single tsconfig.json that cleanly covers both src/ and
 * tests/ for `parserOptions.project` without extra maintenance, and the
 * project is small enough that `tsc --noEmit` already catches type errors.
 * Non-type-aware `flat/recommended` gives real value (unused vars,
 * no-explicit-any warnings, etc.) without that overhead.
 *
 * Built directly from @typescript-eslint/{parser,eslint-plugin} (no
 * `@eslint/js` or `typescript-eslint` meta-package dependency) to keep the
 * dependency surface identical to what's declared in package.json.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'html-report/**',
      'allure-results/**',
      'a11y-report/**',
      'visual-regression/**',
      'performance-results/**',
      'logs/**',
      'screenshots/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,

      // TypeScript already validates identifiers via the compiler; `no-undef`
      // doesn't understand TS-only constructs (ambient types, declaration
      // merging) and produces false positives on valid TS code. This mirrors
      // typescript-eslint's own `eslint-recommended` override.
      'no-undef': 'off',

      // The codebase uses `any` deliberately at a handful of narrow
      // boundaries (parsing untyped request bodies in MSW mock handlers,
      // generic test-helper signatures). Keep it visible as a warning
      // rather than a hard error so those spots stay easy to spot without
      // blocking the build.
      '@typescript-eslint/no-explicit-any': 'warn',

      // `declare global { namespace jest { ... } }` in tests/setup.ts is the
      // idiomatic (and only) way to augment Jest's ambient matcher types via
      // declaration merging — not the "organize code in a namespace"
      // anti-pattern this rule targets. Allow ambient namespace declarations.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],

      // Unused vars/args are a real bug signal in this codebase (tsc's
      // noUnusedLocals/noUnusedParameters already enforce it at the type
      // level) — keep it an error, but allow an explicit leading-underscore
      // escape hatch for intentionally-unused parameters.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
