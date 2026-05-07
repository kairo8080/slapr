# Task: Test And CI Baseline

## Goal

Give SLAPR a small verification suite that Codex can run before code changes are considered complete.

## Scope

- `package.json`
- `playwright.config.ts`
- `tests/**`
- `.github/workflows/*`

## Acceptance Criteria

- `npm run lint` exists.
- `npm run test` exists and runs unit tests.
- `npm run test:smoke` exists and runs browser smoke tests.
- `npm run check` chains typecheck, lint, and unit tests.
- CI runs install, typecheck, lint, test, and build.

## Notes

Start with high-signal tests. Do not overbuild coverage before `GeneratorApp.tsx` is split into smaller testable modules.
