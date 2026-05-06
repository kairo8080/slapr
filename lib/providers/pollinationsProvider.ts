import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type PollinationsInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

const DEFAULT_BASE_URL = "https://image.pollinations.ai/prompt";

export async function generatePollinationsImage({
  input,
  builtPrompt,
  model,
  seed
}: PollinationsInput): Promise<GenerationResult> {
  const prompt = buildPollinationsPrompt(input, builtPrompt.prompt);
  const imageUrl = makePollinationsUrl(prompt, model, seed);
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const response = await fetch(imageUrl, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Pollinations image generation failed: ${detail.slice(0, 220)}`
        : "Pollinations image generation failed."
    );
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const imageBytes = Buffer.from(await response.arrayBuffer()).toString("base64");
  const notes = ["Generated through the Pollinations public image API."];
  if (input.sourceImage?.dataUrl) {
    notes.push("Pollinations is text-to-image here; the uploaded image is described in the prompt, not edited as pixels.");
  }

  return {
    imageUrl: `data:${contentType};base64,${imageBytes}`,
    prompt,
    provider: "pollinations",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes
  };
}

function makePollinationsUrl(prompt: string, model: string, seed: string): string {
  const baseUrl = (process.env.POLLINATIONS_IMAGE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const pathBase = baseUrl.endsWith("/prompt") || baseUrl.endsWith("/image") ? baseUrl : `${baseUrl}/image`;
  const url = new URL(`${pathBase}/${encodeURIComponent(prompt)}`);
  url.searchParams.set("model", process.env.POLLINATIONS_IMAGE_MODEL || model || "flux");
  url.searchParams.set("width", "1024");
  url.searchParams.set("height", "1024");
  url.searchParams.set("seed", hashSeed(seed).toString());
  url.searchParams.set("nologo", "true");
  url.searchParams.set("private", "true");
  url.searchParams.set("enhance", "true");
  return url.toString();
}

function buildPollinationsPrompt(input: GenerationRequest, prompt: string): string {
  const sourceNote = input.sourceImage
    ? ` Reference the uploaded character concept named "${input.characterName || input.sourceImage.name}" without copying logos or watermarks.`
    : "";
  return `${prompt}${sourceNote}`.slice(0, 2800);
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash || Date.now();
}
