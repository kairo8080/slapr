import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type GoogleInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
  inline_data?: {
    mime_type?: string;
    data?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

type ImagenResponse = {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
  }>;
  error?: {
    message?: string;
  };
};

export async function generateGoogleImage({
  input,
  builtPrompt,
  model,
  seed
}: GoogleInput): Promise<GenerationResult> {
  const apiKey = input.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google Gemini key required. Add one in the API Keys tab or set GEMINI_API_KEY on the server.");
  }

  if (model.startsWith("imagen-")) {
    return generateImagen({ input, builtPrompt, model, seed, apiKey });
  }

  return generateGeminiImage({ input, builtPrompt, model, seed, apiKey });
}

async function generateGeminiImage({
  input,
  builtPrompt,
  model,
  seed,
  apiKey
}: GoogleInput & { apiKey: string }): Promise<GenerationResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const parts: GeminiPart[] = [{ text: builtPrompt.prompt }];

  if (input.sourceImage?.dataUrl) {
    parts.push({
      inlineData: {
        mimeType: input.sourceImage.mimeType,
        data: extractBase64(input.sourceImage.dataUrl)
      }
    });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ parts }]
    })
  });

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Google Gemini image generation failed.");
  }

  const responseParts = payload?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = responseParts.find((part) => part.inlineData?.data || part.inline_data?.data);
  const data = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
  const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";
  if (!data) {
    const text = responseParts.map((part) => part.text).filter(Boolean).join(" ");
    throw new Error(text || "Google Gemini returned text but no image. Try a more explicit image generation prompt.");
  }

  return {
    imageUrl: `data:${mimeType};base64,${data}`,
    prompt: builtPrompt.prompt,
    provider: "google",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes: input.sourceImage?.dataUrl
      ? ["Generated with Gemini native image input and text instructions."]
      : ["Generated with Gemini native image generation."]
  };
}

async function generateImagen({
  input,
  builtPrompt,
  model,
  seed,
  apiKey
}: GoogleInput & { apiKey: string }): Promise<GenerationResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      instances: [{ prompt: builtPrompt.prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatioForTemplate(input.templateId)
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as ImagenResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Google Imagen generation failed.");
  }

  const data = payload?.predictions?.[0]?.bytesBase64Encoded;
  if (!data) {
    throw new Error("Google Imagen response did not include an image.");
  }

  const notes = ["Generated with Google Imagen text-to-image."];
  if (input.sourceImage?.dataUrl) {
    notes.push("Imagen is text-to-image here; the uploaded source image is referenced only in the prompt.");
  }

  return {
    imageUrl: `data:image/png;base64,${data}`,
    prompt: builtPrompt.prompt,
    provider: "google",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    status: "ready",
    notes
  };
}

function extractBase64(dataUrl: string): string {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Uploaded image data is invalid.");
  return base64;
}

function aspectRatioForTemplate(templateId: string): string {
  if (templateId === "story") return "9:16";
  if (templateId === "wide-banner") return "16:9";
  return "1:1";
}
