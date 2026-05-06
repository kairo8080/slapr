import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type XAIInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

type XAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: string;
  };
};

const BASE_URL = "https://api.x.ai/v1";

export async function generateXAIImage({
  input,
  builtPrompt,
  model,
  seed
}: XAIInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("Grok / xAI key required. Add one in the API tab or set XAI_API_KEY on the server.");
  }

  const hasSourceImage = Boolean(input.sourceImage?.dataUrl);
  const response = hasSourceImage
    ? await postImageEdit({ apiKey, input, builtPrompt, model })
    : await postImageGeneration({ apiKey, input, builtPrompt, model });

  const payload = (await response.json().catch(() => null)) as XAIImageResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || "xAI image generation failed.");
  }

  const image = payload?.data?.[0];
  const imageUrl = image?.b64_json
    ? `data:${mimeFromBase64(image.b64_json)};base64,${image.b64_json}`
    : image?.url;
  if (!imageUrl) {
    throw new Error("xAI response did not include an image.");
  }

  return {
    imageUrl,
    prompt: image?.revised_prompt || builtPrompt.prompt,
    provider: "xai",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    aspectRatio: input.aspectRatio,
    status: "ready",
    notes: hasSourceImage
      ? ["Edited from the uploaded source image through the xAI image API."]
      : ["Generated through the xAI image API."]
  };
}

async function postImageGeneration({
  apiKey,
  input,
  builtPrompt,
  model
}: Pick<XAIInput, "input" | "builtPrompt" | "model"> & { apiKey: string }) {
  return fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: builtPrompt.prompt,
      aspect_ratio: toXaiAspectRatio(input.aspectRatio)
    })
  });
}

async function postImageEdit({
  apiKey,
  input,
  builtPrompt,
  model
}: Pick<XAIInput, "input" | "builtPrompt" | "model"> & { apiKey: string }) {
  if (!input.sourceImage?.dataUrl) {
    throw new Error("Source image is required for xAI image editing.");
  }

  return fetch(`${BASE_URL}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: builtPrompt.prompt,
      image: {
        type: "image_url",
        url: input.sourceImage.dataUrl
      },
      aspect_ratio: toXaiAspectRatio(input.aspectRatio)
    })
  });
}

function toXaiAspectRatio(aspectRatio: XAIInput["input"]["aspectRatio"]) {
  // xAI exposes 20:9 as its ultrawide enum; the UI keeps 21:9 as the user-facing label.
  return aspectRatio === "21:9" ? "20:9" : aspectRatio || "1:1";
}

function mimeFromBase64(base64: string): string {
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}
