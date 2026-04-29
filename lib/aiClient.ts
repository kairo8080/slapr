import { getModelPreset } from "@/lib/registries/models";
import { generateMockCreative } from "@/lib/providers/mockProvider";
import { generateOpenAIImage } from "@/lib/providers/openaiProvider";
import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

export async function generateCreative(
  input: GenerationRequest,
  builtPrompt: BuiltPrompt
): Promise<GenerationResult> {
  const seed = input.seed || crypto.randomUUID();
  const selectedModel = getModelPreset(input.modelId);
  const provider = resolveProvider(selectedModel.provider, input.type);

  if (provider === "openai" && input.type === "image") {
    return generateOpenAIImage({
      input,
      builtPrompt,
      model: process.env.OPENAI_IMAGE_MODEL || selectedModel.modelName || "gpt-image-1",
      seed
    });
  }

  return generateMockCreative({
    input,
    builtPrompt,
    model:
      input.type === "video"
        ? "slapr-video-prompt-v0"
        : selectedModel.modelName || "slapr-mock-v0",
    seed
  });
}

function resolveProvider(provider: string, type: GenerationRequest["type"]): "mock" | "openai" {
  if (type === "video") return "mock";
  if (provider === "openai") return "openai";
  if (provider === "mock") return "mock";
  return process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY)
    ? "openai"
    : "mock";
}
