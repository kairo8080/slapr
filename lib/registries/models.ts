import type { CredentialProvider, ModelProvider } from "@/lib/types";

export type ProviderPreset = {
  id: ModelProvider;
  label: string;
  category: "local" | "free" | "paid" | "open-source";
  requiresKey: boolean;
  supportsBrowserKey: boolean;
  implemented: boolean;
  envVar?: string;
  keyUrl?: string;
  docsUrl?: string;
  keyLabel?: string;
  summary: string;
  steps: string[];
};

export type ModelPreset = {
  id: string;
  label: string;
  provider: ModelProvider;
  output: "image" | "video-prompt" | "auto";
  modelName?: string;
  description: string;
  supportsImageInput: boolean;
  requiresServer: boolean;
  requiresApiKey?: boolean;
};

export const providerPresets: ProviderPreset[] = [
  {
    id: "mock",
    label: "SLAPR Local",
    category: "local",
    requiresKey: false,
    supportsBrowserKey: false,
    implemented: true,
    summary: "Runs fully in the app for mock previews and video prompt drafts.",
    steps: ["No API key is required.", "Use this for instant previews and layout checks."]
  },
  {
    id: "pollinations",
    label: "Pollinations",
    category: "free",
    requiresKey: false,
    supportsBrowserKey: false,
    implemented: true,
    envVar: "POLLINATIONS_API_KEY",
    keyUrl: "https://pollinations.ai",
    docsUrl: "https://github.com/pollinations/pollinations",
    summary: "Public no-key image generation path for quick text-to-image tests.",
    steps: [
      "Start with the no-key public model.",
      "If you add a Pollinations key later, keep it in server environment variables."
    ]
  },
  {
    id: "openai",
    label: "OpenAI",
    category: "paid",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "OPENAI_API_KEY",
    keyUrl: "https://platform.openai.com/api-keys",
    docsUrl: "https://developers.openai.com/api/docs/guides/image-generation",
    keyLabel: "OpenAI secret key",
    summary: "GPT Image models for high-quality generation and source-image edits.",
    steps: [
      "Open the API keys page in the OpenAI dashboard.",
      "Create a project API key and copy it once.",
      "Paste it in the API Keys tab or set OPENAI_API_KEY on the server.",
      "Select a GPT Image model in /brief before generating."
    ]
  },
  {
    id: "google",
    label: "Google Gemini",
    category: "paid",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "GEMINI_API_KEY",
    keyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
    keyLabel: "Gemini API key",
    summary: "Nano Banana and Imagen routes for Gemini image generation.",
    steps: [
      "Open Google AI Studio and create an API key.",
      "Copy the key from the AI Studio key page.",
      "Paste it in the API Keys tab or set GEMINI_API_KEY on the server.",
      "Use Nano Banana for edits or Imagen for text-to-image."
    ]
  },
  {
    id: "stability",
    label: "Stability AI",
    category: "paid",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "STABILITY_API_KEY",
    keyUrl: "https://platform.stability.ai",
    docsUrl: "https://platform.stability.ai/docs/api-reference",
    keyLabel: "Stability API key",
    summary: "Stable Image Core and Ultra routes for production-grade text-to-image.",
    steps: [
      "Open the Stability AI Developer Platform.",
      "Create or copy an API key from the profile API Keys view.",
      "Paste it in the API Keys tab or set STABILITY_API_KEY on the server.",
      "Select Core for speed or Ultra for higher detail."
    ]
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    category: "open-source",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "HF_TOKEN",
    keyUrl: "https://huggingface.co/settings/tokens",
    docsUrl: "https://huggingface.co/docs/inference-providers/tasks/text-to-image",
    keyLabel: "Hugging Face token",
    summary: "Inference Providers token for open image models exposed on Hugging Face.",
    steps: [
      "Open Hugging Face Settings -> Access Tokens.",
      "Create a token that can call Inference Providers.",
      "Paste it in the API Keys tab or set HF_TOKEN on the server.",
      "Select one of the open text-to-image models in /brief."
    ]
  },
  {
    id: "xai",
    label: "Grok / xAI",
    category: "paid",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "XAI_API_KEY",
    keyUrl: "https://console.x.ai",
    docsUrl: "https://docs.x.ai/developers/model-capabilities/images/generation",
    keyLabel: "xAI API key",
    summary: "Grok Imagine image generation through the xAI image API.",
    steps: [
      "Open the xAI API Console and sign in.",
      "Create or copy an API key from the console.",
      "Paste it in the API tab or set XAI_API_KEY on the server.",
      "Select Grok Imagine Image in Generate."
    ]
  },
  {
    id: "bfl",
    label: "Black Forest Labs",
    category: "paid",
    requiresKey: true,
    supportsBrowserKey: true,
    implemented: true,
    envVar: "BFL_API_KEY",
    keyUrl: "https://dashboard.bfl.ai",
    docsUrl: "https://docs.bfl.ai/flux_2/flux2_text_to_image",
    keyLabel: "BFL API key",
    summary: "Official FLUX.2 API routes from Black Forest Labs.",
    steps: [
      "Open the Black Forest Labs dashboard and sign in.",
      "Create or copy an API key from the dashboard.",
      "Paste it in the API tab or set BFL_API_KEY on the server.",
      "Select a FLUX.2 model in Generate."
    ]
  }
];

export const credentialProviders: CredentialProvider[] = [
  "openai",
  "google",
  "stability",
  "huggingface",
  "xai",
  "bfl"
];

export const modelPresets: ModelPreset[] = [
  {
    id: "auto",
    label: "Auto",
    provider: "auto",
    output: "auto",
    description: "Uses the best available SLAPR path for this environment.",
    supportsImageInput: true,
    requiresServer: false
  },
  {
    id: "mock-character-lock",
    label: "SLAPR Character Lock",
    provider: "mock",
    output: "image",
    modelName: "slapr-character-lock-v0",
    description: "Local preview that preserves the uploaded PFP/NFT in a social composition.",
    supportsImageInput: true,
    requiresServer: false
  },
  {
    id: "mock-remix-board",
    label: "SLAPR Remix Board",
    provider: "mock",
    output: "image",
    modelName: "slapr-remix-board-v0",
    description: "Local alternate layout for side-by-side comparison.",
    supportsImageInput: true,
    requiresServer: false
  },
  {
    id: "pollinations-flux",
    label: "Pollinations Flux",
    provider: "pollinations",
    output: "image",
    modelName: "flux",
    description: "No-key public text-to-image URL API path for quick real image generations.",
    supportsImageInput: false,
    requiresServer: true
  },
  {
    id: "xai-grok-imagine",
    label: "Grok Imagine Image",
    provider: "xai",
    output: "image",
    modelName: "grok-imagine-image",
    description: "xAI Grok Imagine route for image generation and JSON image edits.",
    supportsImageInput: true,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "bfl-flux-2-pro-preview",
    label: "FLUX.2 Pro Preview",
    provider: "bfl",
    output: "image",
    modelName: "flux-2-pro-preview",
    description: "Latest FLUX.2 Pro endpoint for high-quality text-to-image generation.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "bfl-flux-2-pro",
    label: "FLUX.2 Pro",
    provider: "bfl",
    output: "image",
    modelName: "flux-2-pro",
    description: "Pinned FLUX.2 Pro endpoint for reproducible production generations.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "bfl-flux-2-klein-9b-preview",
    label: "FLUX.2 Klein 9B Preview",
    provider: "bfl",
    output: "image",
    modelName: "flux-2-klein-9b-preview",
    description: "Latest fast FLUX.2 Klein 9B endpoint.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "bfl-flux-2-klein-9b",
    label: "FLUX.2 Klein 9B",
    provider: "bfl",
    output: "image",
    modelName: "flux-2-klein-9b",
    description: "Pinned fast FLUX.2 Klein 9B endpoint.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "openai-gpt-image-2",
    label: "OpenAI GPT Image 2",
    provider: "openai",
    output: "image",
    modelName: "gpt-image-2",
    description: "Current OpenAI image model for high-quality generation and source-image edits.",
    supportsImageInput: true,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "openai-gpt-image-1-5",
    label: "OpenAI GPT Image 1.5",
    provider: "openai",
    output: "image",
    modelName: "gpt-image-1.5",
    description: "Previous GPT Image model with the same basic Image API surface.",
    supportsImageInput: true,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "google-nano-banana-2",
    label: "Google Nano Banana 2",
    provider: "google",
    output: "image",
    modelName: "gemini-3.1-flash-image-preview",
    description: "Gemini 3.1 Flash Image Preview for efficient image generation and edits.",
    supportsImageInput: true,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "google-nano-banana-pro",
    label: "Google Nano Banana Pro",
    provider: "google",
    output: "image",
    modelName: "gemini-3-pro-image-preview",
    description: "Gemini 3 Pro Image Preview for detailed production assets.",
    supportsImageInput: true,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "google-imagen-4",
    label: "Google Imagen 4",
    provider: "google",
    output: "image",
    modelName: "imagen-4.0-generate-001",
    description: "Imagen text-to-image model for high-fidelity generated scenes.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "stability-core",
    label: "Stability Core",
    provider: "stability",
    output: "image",
    modelName: "stable-image-core",
    description: "Stable Image Core route for fast general text-to-image generation.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "stability-ultra",
    label: "Stability Ultra",
    provider: "stability",
    output: "image",
    modelName: "stable-image-ultra",
    description: "Stable Image Ultra route for higher-detail text-to-image generation.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "hf-qwen-image",
    label: "HF Qwen Image",
    provider: "huggingface",
    output: "image",
    modelName: "Qwen/Qwen-Image",
    description: "Open model route through Hugging Face Inference Providers.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "hf-hyper-sd",
    label: "HF Hyper-SD",
    provider: "huggingface",
    output: "image",
    modelName: "ByteDance/Hyper-SD",
    description: "Fast open text-to-image model route through Hugging Face.",
    supportsImageInput: false,
    requiresServer: true,
    requiresApiKey: true
  },
  {
    id: "mock-video-prompt",
    label: "Video Prompt Mock",
    provider: "mock",
    output: "video-prompt",
    modelName: "slapr-video-prompt-v0",
    description: "Local motion prompt draft for future video integrations.",
    supportsImageInput: true,
    requiresServer: false
  }
];

export function getModelPreset(id = "auto"): ModelPreset {
  return modelPresets.find((model) => model.id === id) ?? modelPresets[0];
}

export function getProviderPreset(id: ModelProvider): ProviderPreset {
  return providerPresets.find((provider) => provider.id === id) ?? providerPresets[0];
}

export function isCredentialProvider(provider: ModelProvider): provider is CredentialProvider {
  return credentialProviders.includes(provider as CredentialProvider);
}
