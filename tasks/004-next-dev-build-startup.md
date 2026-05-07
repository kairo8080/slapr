# Task: Next Dev And Build Startup

## Goal

Make `npm run dev:test`, `npm run test:smoke`, and `npm run build` reliably start and finish on the pinned Node version.

## Scope

- `package.json`
- `.nvmrc`
- `next.config.mjs`
- `playwright.config.ts`
- local Node/runtime documentation

## Acceptance Criteria

- `npm run dev:test` starts on `127.0.0.1:3100` and serves `/`.
- `npm run test:smoke` passes using installed Chrome or documented Playwright browsers.
- `npm run build` completes without hanging.
- README documents any required Node version or browser install step.

## Notes

During the Codex maturity setup, `npm run check` passed after the TypeScript upgrade, but `next dev` and `next build` hung silently under local Node `v23.6.0`. The repo now pins Node `22.13.0`; verify again from that runtime before changing Next configuration.
