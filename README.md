# SLAPR

Crypto-native image and video prompt generation for viral social content.

## MVP

- Prompt builder for token, narrative, tone, style, and output type
- Image generation flow with mock provider by default
- OpenAI image provider ready behind environment variables
- Video prompt generation mock for future model integration
- Copy and regenerate workflow
- Modular registries for models, providers, styles, tones, and templates

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local`.

```bash
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
```

Set `AI_PROVIDER=openai` and add `OPENAI_API_KEY` to use OpenAI image generation.
