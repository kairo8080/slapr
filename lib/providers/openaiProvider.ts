import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: string;
  };
};

type OpenAIInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

export async function generateOpenAIImage({
  input,
  builtPrompt,
  model,
  seed
}: OpenAIInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI key required. Add one in the API Keys tab or set OPENAI_API_KEY on the server.");
  }

  const hasSourceImage = Boolean(input.sourceImage?.dataUrl);
  const endpoint = hasSourceImage ? "edits" : "generations";
  const response = hasSourceImage
    ? await postImageEdit({ apiKey, input, builtPrompt, model })
    : await postImageGeneration({ apiKey, builtPrompt, model });

  const payload = (await response.json()) as OpenAIImageResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI image generation failed.");
  }

  const image = payload.data?.[0];
  const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;
  if (!imageUrl) {
    throw new Error("OpenAI response did not include an image.");
  }

  return {
    imageUrl,
    prompt: image?.revised_prompt || builtPrompt.prompt,
    provider: "openai",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes: hasSourceImage
      ? ["Edited from the uploaded source image with character consistency instructions."]
      : ["Generated without a source image."]
  };
}

async function postImageGeneration({
  apiKey,
  builtPrompt,
  model
}: Pick<OpenAIInput, "builtPrompt" | "model"> & { apiKey: string }) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: builtPrompt.prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "png"
    })
  });
}

async function postImageEdit({
  apiKey,
  input,
  builtPrompt,
  model
}: Pick<OpenAIInput, "input" | "builtPrompt" | "model"> & { apiKey: string }) {
  if (!input.sourceImage?.dataUrl) {
    throw new Error("Source image is required for OpenAI image editing.");
  }

  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", builtPrompt.prompt);
  formData.append("size", "1024x1024");
  formData.append("quality", "medium");
  formData.append("output_format", "png");
  formData.append("background", "auto");
  if (input.consistencyId === "strict" && model !== "gpt-image-2") {
    formData.append("input_fidelity", "high");
  }
  formData.append(
    "image",
    dataUrlToBlob(input.sourceImage.dataUrl, input.sourceImage.mimeType),
    normalizeFileName(input.sourceImage.name)
  );

  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });
}

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Uploaded image data is invalid.");
  return new Blob([Buffer.from(base64, "base64")], { type: mimeType });
}

function normalizeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.-]+/g, "_").slice(0, 96);
  return cleaned || "slapr-source.png";
}
