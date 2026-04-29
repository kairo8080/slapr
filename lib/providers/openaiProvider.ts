import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: builtPrompt.prompt,
      size: "1024x1024"
    })
  });

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
    prompt: builtPrompt.prompt,
    provider: "openai",
    model,
    type: input.type,
    seed
  };
}
