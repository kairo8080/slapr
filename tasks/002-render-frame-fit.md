# Task: Render Frame Fit

## Goal

Generated images must remain fully visible inside the center render frame for `1:1`, `16:9`, `9:16`, and `21:9`.

## Scope

- `components/GeneratorApp.tsx`
- `app/globals.css`
- `out/index.html` only if the static preview bundle must be updated
- Playwright smoke tests

## Acceptance Criteria

- No generated image is cropped by the output frame.
- Save button behavior remains unchanged.
- Empty, loading, and generated states keep stable frame dimensions.
- Playwright verifies the generated-image frame for all four ratios.
- Run `npm run test:smoke`.

## Notes

Prefer object-fit and stable container sizing over viewport zoom hacks. Desktop density should stay high, but the image content must not be clipped.
