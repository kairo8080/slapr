import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type StabilityInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

const CORE_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/core";
const ULTRA_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/ultra";

export async function generateStabilityImage({
  input,
  builtPrompt,
  model,
  seed
}: StabilityInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("Stability AI key required. Add one in the API Keys tab or set STABILITY_API_KEY on the server.");
  }

  const formData = new FormData();
  formData.append("prompt", builtPrompt.prompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", aspectRatioForTemplate(input.templateId));

  const response = await fetch(model.includes("ultra") ? ULTRA_ENDPOINT : CORE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "image/*",
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Stability AI generation failed: ${detail.slice(0, 220)}`
        : "Stability AI generation failed."
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const imageBytes = Buffer.from(await response.arrayBuffer()).toString("base64");
  const notes = ["Generated with Stability AI Stable Image text-to-image."];
  if (input.sourceImage?.dataUrl) {
    notes.push("This Stability route is text-to-image; the uploaded source image is referenced only in the prompt.");
  }

  return {
    imageUrl: `data:${contentType};base64,${imageBytes}`,
    prompt: builtPrompt.prompt,
    provider: "stability",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes
  };
}

function aspectRatioForTemplate(templateId: string): string {
  if (templateId === "story") return "9:16";
  if (templateId === "wide-banner") return "16:9";
  return "1:1";
}
