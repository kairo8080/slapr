# SLAPR Roadmap

## Phase 1: Agent Readiness

- Add `AGENTS.md` with stack, commands, folder rules, security rules, and verification expectations.
- Add `PRD.md`, this roadmap, and task specs.
- Add lint, unit test, smoke test, and check commands.
- Decide and document the generated `out/` policy.

## Phase 2: Alpha Stabilization

- Split `GeneratorApp.tsx` into focused UI components and hooks.
- Extract image export and ratio-fit helpers into testable modules.
- Unify provider request validation with typed schemas.
- Add smoke tests for no-image save, local generation, API tab, and all aspect ratios.

## Phase 3: Provider Hardening

- Normalize provider error mapping.
- Add request/response tests for each provider client.
- Clarify which providers work in static/local/server deployments.
- Add clearer key-status refresh behavior.

## Phase 4: Deployment Readiness

- Verify fresh-clone `npm ci`, `npm run build`, and `npm run build:static`.
- Pin Node version for local, GitHub Actions, and Vercel.
- Separate static Pages workflow from server-capable Vercel deployment notes.
- Add CI checks for typecheck, lint, unit tests, and static build.

## Phase 5: Product Polish

- Improve mobile ergonomics without compromising desktop density.
- Improve accessibility labels and keyboard flow.
- Add richer provider setup states.
- Add saved generation history once core generation is stable.
