import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type HuggingFaceInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

type HuggingFaceError = {
  error?: string;
  estimated_time?: number;
};

export async function generateHuggingFaceImage({
  input,
  builtPrompt,
  model,
  seed
}: HuggingFaceInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("Hugging Face token required. Add one in the API Keys tab or set HF_TOKEN on the server.");
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Accept: "image/png",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true"
    },
    body: JSON.stringify({
      inputs: builtPrompt.prompt,
      parameters: {
        negative_prompt: builtPrompt.negativePrompt,
        width: 1024,
        height: 1024,
        seed: hashSeed(seed)
      }
    })
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const detail = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as HuggingFaceError | null)?.error
      : await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Hugging Face generation failed: ${detail.slice(0, 220)}`
        : "Hugging Face generation failed."
    );
  }

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as HuggingFaceError | null;
    throw new Error(payload?.error || "Hugging Face returned JSON instead of an image.");
  }

  const imageBytes = Buffer.from(await response.arrayBuffer()).toString("base64");
  const notes = ["Generated through Hugging Face Inference Providers."];
  if (input.sourceImage?.dataUrl) {
    notes.push("This Hugging Face route is text-to-image; the uploaded image is referenced only in the prompt.");
  }

  return {
    imageUrl: `data:${contentType || "image/png"};base64,${imageBytes}`,
    prompt: builtPrompt.prompt,
    provider: "huggingface",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash || Date.now();
}
