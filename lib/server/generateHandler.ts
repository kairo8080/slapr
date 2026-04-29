import { buildPrompt } from "@/lib/promptBuilder";
import { generateCreative } from "@/lib/aiClient";
import { getStylePreset, stylePresets } from "@/lib/registries/styles";
import { getTemplatePreset, templatePresets } from "@/lib/registries/templates";
import { getTonePreset, tonePresets } from "@/lib/registries/tones";
import type { ApiError, GenerationRequest, GenerationType } from "@/lib/types";

export async function handleGenerate(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<GenerationRequest>;
    const input = normalizeGenerationRequest(body);
    const builtPrompt = buildPrompt(input);
    const result = await generateCreative(input, builtPrompt);

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    const payload: ApiError = { error: message };
    return Response.json(payload, { status: 400 });
  }
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

  return {
    token,
    narrative,
    type,
    toneId,
    styleId,
    templateId,
    modelId: body.modelId || "auto",
    seed: body.seed
  };
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
