# Task: Stabilize Provider Routing

## Goal

Make provider selection, key status, and provider error messages predictable across the Next API routes and local static/API server.

## Scope

- `lib/aiClient.ts`
- `lib/server/checkKeyHandler.ts`
- `lib/server/generateHandler.ts`
- `lib/providers/*`
- `scripts/local-grok-server.mjs`
- `out/server.mjs` only if the static preview bundle must be updated

## Acceptance Criteria

- Missing keys produce actionable errors without exposing secrets.
- Provider failures surface the provider name and HTTP status when available.
- xAI, OpenAI, Google, Stability, Hugging Face, BFL, Pollinations, and mock paths keep their current public behavior.
- Unit tests cover at least missing-key and rejected-key cases.
- Run `npm run typecheck` and `npm run test`.

## Notes

Keep legacy `api/*.ts` wrappers thin. Shared behavior should live in `lib/server` or `lib/providers`.
