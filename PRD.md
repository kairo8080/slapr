# SLAPR PRD

## Product Summary

SLAPR is a crypto-native creative terminal for turning PFPs, NFTs, token ideas, and short prompts into social-ready images. The alpha goal is to make the fastest browser cockpit for crypto teams and creators who need repeatable visuals across model providers.

## Primary Users

- Crypto founders and operators preparing launch assets.
- NFT and PFP communities remixing recognizable characters.
- Meme pages and social managers creating fast feed visuals.
- Builders comparing image model quality across providers.

## Core Workflows

1. Prompt-only generation: enter a short idea, choose a model and ratio, generate, then save.
2. Source-image remix: upload a PFP/NFT, preserve identity, choose modification strength, generate, then save.
3. Provider setup: add a provider key, validate it, select a provider model, and generate through the same UI.
4. Local fallback: continue previewing layout and prompts when remote providers are unavailable.

## MVP Scope

- Desktop-first terminal workspace.
- Image generation for `1:1`, `16:9`, `9:16`, and `21:9`.
- PNG, JPG, WEBP, and SVG export.
- Model registry with provider status.
- Browser session/local key manager for local testing.
- Server-side provider route support for hosted deployments.
- Static/local preview path for fast desktop testing.

## Non-Goals For Alpha

- Payment, billing, or user accounts.
- Public hosted secret storage.
- Full video generation.
- Collaborative workspaces.
- Enterprise asset libraries.

## Success Criteria

- A new contributor can run the app and checks from README and `AGENTS.md`.
- A Codex task can identify the right files, make a scoped change, and verify it without extra repo explanation.
- Generated or mock images remain fully visible inside the render frame for every supported ratio.
- Provider failures return visible, actionable errors without leaking secrets.
- Static and server deployments have clearly documented differences.

## Current Status

- Version: `0.1.2 alpha`
- Local mock generation works without keys.
- xAI/OpenAI/local static server paths exist for quick testing.
- Next server provider modules exist for OpenAI, Google, Stability, Hugging Face, xAI, BFL, Pollinations, and mock generation.
- Testing, linting, and task-based agent workflow are being added.
