import { buildPrompt } from "@/lib/promptBuilder";
import { generateCreative } from "@/lib/aiClient";
import {
  consistencyPresets,
  modificationPresets
} from "@/lib/registries/modifications";
import { modelPresets } from "@/lib/registries/models";
import { getStylePreset, stylePresets } from "@/lib/registries/styles";
import { getTemplatePreset, templatePresets } from "@/lib/registries/templates";
import { getTonePreset, tonePresets } from "@/lib/registries/tones";
import type { ApiError, GenerationRequest, GenerationType } from "@/lib/types";

export async function handleGenerate(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<GenerationRequest>;
    const result = await generateFromPayload(body);

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    const payload: ApiError = { error: message };
    return Response.json(payload, { status: 400 });
  }
}

export async function generateFromPayload(body: Partial<GenerationRequest>) {
  const input = normalizeGenerationRequest(body);
  const builtPrompt = buildPrompt(input);
  return generateCreative(input, builtPrompt);
}

function normalizeGenerationRequest(body: Partial<GenerationRequest>): GenerationRequest {
  const token = normalizeText(body.token, 42);
  const narrative = normalizeText(body.narrative, 260);
  if (!token) throw new Error("Token or brand is required.");
  if (!narrative) throw new Error("Narrative is required.");

  const type: GenerationType = body.type === "video" ? "video" : "image";
  const toneId = body.toneId && getTonePreset(body.toneId) ? body.toneId : tonePresets[0].id;
  const styleId =
    body.styleId && getStylePreset(body.styleId) ? body.styleId : stylePresets[0].id;
  const templateId =
    body.templateId && getTemplatePreset(body.templateId) ? body.templateId : templatePresets[0].id;
  const modificationId =
    body.modificationId && modificationPresets.some((preset) => preset.id === body.modificationId)
      ? body.modificationId
      : modificationPresets[0].id;
  const consistencyId =
    body.consistencyId && consistencyPresets.some((preset) => preset.id === body.consistencyId)
      ? body.consistencyId
      : consistencyPresets[0].id;
  const modelId =
    body.modelId && modelPresets.some((model) => model.id === body.modelId) ? body.modelId : "auto";
  const sourceImage = normalizeSourceImage(body.sourceImage);
  const aspectRatio = normalizeAspectRatio(body.aspectRatio);

  return {
    token,
    narrative,
    type,
    toneId,
    styleId,
    templateId,
    modelId,
    sourceImage,
    characterName: normalizeText(body.characterName, 42),
    modificationId,
    consistencyId,
    seed: body.seed,
    apiKey: normalizeSecret(body.apiKey, 4096),
    aspectRatio,
    enhancePrompt: body.enhancePrompt !== false
  };
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeSourceImage(value: unknown): GenerationRequest["sourceImage"] {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as GenerationRequest["sourceImage"];
  if (!candidate?.dataUrl || !candidate.mimeType || !candidate.name) return undefined;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(candidate.dataUrl)) return undefined;

  return {
    dataUrl: candidate.dataUrl,
    mimeType: candidate.mimeType.slice(0, 32),
    name: candidate.name.slice(0, 120),
    width: candidate.width,
    height: candidate.height
  };
}

function normalizeSecret(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || undefined;
}

function normalizeAspectRatio(value: unknown): GenerationRequest["aspectRatio"] {
  return value === "16:9" || value === "9:16" || value === "21:9" ? value : "1:1";
}
