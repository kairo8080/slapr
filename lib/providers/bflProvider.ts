import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type BFLInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

type BFLCreateResponse = {
  id?: string;
  polling_url?: string;
  error?: string;
  detail?: string;
};

type BFLPollResponse = {
  status?: "Ready" | "Pending" | "Request Moderated" | "Content Moderated" | "Error" | "Failed";
  result?: {
    sample?: string;
  };
  error?: string;
  detail?: string;
};

const BASE_URL = "https://api.bfl.ai/v1";

export async function generateBFLImage({
  input,
  builtPrompt,
  model,
  seed
}: BFLInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.BFL_API_KEY;
  if (!apiKey) {
    throw new Error("Black Forest Labs key required. Add one in the API tab or set BFL_API_KEY on the server.");
  }

  const prompt = buildBFLPrompt(input, builtPrompt.prompt);
  const createResponse = await fetch(`${BASE_URL}/${model}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "x-key": apiKey
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024
    })
  });

  const created = (await createResponse.json().catch(() => null)) as BFLCreateResponse | null;
  if (!createResponse.ok || !created?.polling_url) {
    throw new Error(
      created?.error ||
        created?.detail ||
        "Black Forest Labs image request failed before polling started."
    );
  }

  const result = await pollForResult(created.polling_url, apiKey);
  const imageUrl = result.result?.sample;
  if (!imageUrl) {
    throw new Error("Black Forest Labs response did not include an image URL.");
  }

  const notes = ["Generated through the Black Forest Labs FLUX API."];
  if (input.sourceImage?.dataUrl) {
    notes.push("This FLUX route is text-to-image; the uploaded image is referenced only in the prompt.");
  }

  return {
    imageUrl,
    prompt,
    provider: "bfl",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes
  };
}

async function pollForResult(pollingUrl: string, apiKey: string): Promise<BFLPollResponse> {
  for (let attempt = 0; attempt < 28; attempt += 1) {
    await sleep(attempt < 8 ? 600 : 1200);
    const response = await fetch(pollingUrl, {
      headers: {
        accept: "application/json",
        "x-key": apiKey
      },
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => null)) as BFLPollResponse | null;
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "Black Forest Labs polling failed.");
    }
    if (payload?.status === "Ready") return payload;
    if (
      payload?.status === "Error" ||
      payload?.status === "Failed" ||
      payload?.status === "Request Moderated" ||
      payload?.status === "Content Moderated"
    ) {
      throw new Error(payload.error || payload.detail || `Black Forest Labs returned ${payload.status}.`);
    }
  }

  throw new Error("Black Forest Labs generation timed out while polling.");
}

function buildBFLPrompt(input: GenerationRequest, prompt: string): string {
  const sourceNote = input.sourceImage
    ? ` Reference the uploaded character concept named "${input.characterName || input.sourceImage.name}" without copying logos or watermarks.`
    : "";
  return `${prompt}${sourceNote}`.slice(0, 4800);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
