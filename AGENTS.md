# AGENTS.md

## Project

SLAPR is a crypto-native image generation terminal for PFP, NFT, token, and campaign visuals. The current product is an alpha desktop-first creative cockpit with local mock generation, provider-backed image generation, source-image remix support, browser API key management, and static/local server paths.

## Stack

- Next.js 15 app router
- React 18
- TypeScript with `strict` enabled
- Tailwind CSS
- Local static/API preview server in `out/server.mjs`
- Provider integrations in `lib/providers`

## Commands

- Install: `npm install`
- Next dev server: `npm run dev`
- Local static/API server: `npm start`
- Static-only server: `npm run serve:static`
- Production build: `npm run build`
- Static export build: `npm run build:static`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Unit tests: `npm run test`
- Browser smoke tests: `npm run test:smoke`
- Full local check: `npm run check`

If a command is unavailable or fails because tooling is missing, fix the tooling before treating the task as done.

## Localhost Workflow

When the user asks to show SLAPR locally, do not hunt ports. Use the known-good static/local path first:

1. Check `127.0.0.1:3000` once with `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
2. If a Node server is already listening from this repo, verify it with `curl -v --max-time 3 http://127.0.0.1:3000/`.
3. If nothing is listening, start `npm start` from `/Users/macpro/Desktop/slapr`.
4. Verify the page returns HTTP 200.
5. Open `http://127.0.0.1:3000/`.

Avoid `npm run dev`, `npm run dev:test`, and `npm run build` just to show the app. Those Next commands are tracked separately in `tasks/004-next-dev-build-startup.md` because they have hung under local Node `v23.6.0`. Use them only when source-level Next behavior must be tested.

## Folder Rules

- `app/`: Next app routes, layout, and route handlers.
- `api/`: legacy Vercel serverless wrappers. Keep these thin and delegate into `lib/server`.
- `components/`: user-facing React UI. Keep components focused and avoid adding more concerns to `GeneratorApp.tsx`.
- `lib/server/`: request parsing, validation, and API handler orchestration.
- `lib/providers/`: external image provider clients. Keep provider-specific request/response logic here.
- `lib/registries/`: model, style, tone, template, and modification metadata.
- `lib/promptBuilder.ts`: prompt construction only.
- `scripts/`: local tooling and preview utilities.
- `public/`: committed static assets.
- `out/`: static export/local server output. Treat this as generated unless a task explicitly asks to update the static preview bundle.
- `tasks/`: scoped agent tasks with acceptance criteria.

## Coding Style

- Prefer existing patterns over new abstractions.
- Use TypeScript types at boundaries; do not use unsafe `any`.
- Keep provider secrets out of client bundles.
- Validate external input before passing it into provider clients.
- Keep generated image export and canvas logic isolated from view components when refactoring.
- Add comments only where the code is genuinely hard to follow.
- Do not reformat unrelated files.
- Do not edit unrelated files.

## Testing Rules

- For server or provider changes, add or update unit tests around request normalization, provider routing, and error responses.
- For UI changes, add or update Playwright smoke coverage for the workflow touched.
- For image-frame changes, verify all ratios: `1:1`, `16:9`, `9:16`, and `21:9`.
- Before delivery, run the smallest relevant check. Prefer `npm run check` when the change touches shared behavior.

## Security Rules

- Never commit `.env`, `.env.local`, `.env*.local`, API keys, wallet secrets, private keys, logs, or generated credentials.
- `.env.example` must contain placeholders only.
- Browser-stored API keys are for local testing convenience. Hosted production should use server-side environment variables.
- Do not print full API keys in logs, UI, tests, screenshots, or docs.
- Do not move provider API calls into client-only code unless the provider is explicitly public/no-key.

## Git Rules

- Preserve user changes.
- Never revert unrelated work.
- Keep commits scoped to the requested task.
- Include generated files only when the task explicitly requires them and the generated-output policy is clear.

## Public Build Cadence

SLAPR is intended to be a build-in-public, open-source GitHub project. Prefer smaller, more frequent pushes so the public repo shows steady work.

- Push after meaningful working sessions instead of holding large private batches.
- Keep commit messages clear and human-readable.
- Run `npm run check` before pushing when code changed.
- Run a secret scan before pushing anything that touched env, API, provider, or credential code.
- Never push `.env`, API keys, local Vercel secrets, logs, test output, or unrelated generated files.
- Use small docs-only commits when the change is process/documentation work.
