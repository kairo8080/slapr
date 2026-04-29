# Contributing

SLAPR is an alpha-stage crypto-native creative tool. Keep contributions focused, modular, and easy to review.

## Local Setup

```bash
npm install
npm run build
```

The app is currently exported as a static GitHub Pages site. Avoid adding server-only behavior to the hosted path unless there is also a static fallback.

## Development Principles

- Keep model providers isolated in `lib/providers`.
- Keep prompt logic in `lib/promptBuilder.ts`.
- Add reusable presets through the registries in `lib/registries`.
- Keep UI changes scoped to components in `components`.
- Do not commit API keys or `.env.local`.

## Pull Requests

- Explain what changed and why.
- Include screenshots for UI changes.
- Run the relevant checks before opening a PR.
- Keep unrelated refactors out of feature PRs.
