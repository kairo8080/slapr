import { getModelPreset } from "@/lib/registries/models";
import { generateMockCreative } from "@/lib/providers/mockProvider";
import { generateGoogleImage } from "@/lib/providers/googleProvider";
import { generateHuggingFaceImage } from "@/lib/providers/huggingfaceProvider";
import { generateOpenAIImage } from "@/lib/providers/openaiProvider";
import { generatePollinationsImage } from "@/lib/providers/pollinationsProvider";
import { generateStabilityImage } from "@/lib/providers/stabilityProvider";
import { generateXAIImage } from "@/lib/providers/xaiProvider";
import { generateBFLImage } from "@/lib/providers/bflProvider";
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
      model: process.env.OPENAI_IMAGE_MODEL || selectedModel.modelName || "gpt-image-2",
      seed
    });
  }

  if (provider === "google" && input.type === "image") {
    return generateGoogleImage({
      input,
      builtPrompt,
      model: process.env.GOOGLE_IMAGE_MODEL || selectedModel.modelName || "gemini-3.1-flash-image-preview",
      seed
    });
  }

  if (provider === "stability" && input.type === "image") {
    return generateStabilityImage({
      input,
      builtPrompt,
      model: process.env.STABILITY_IMAGE_MODEL || selectedModel.modelName || "stable-image-core",
      seed
    });
  }

  if (provider === "huggingface" && input.type === "image") {
    return generateHuggingFaceImage({
      input,
      builtPrompt,
      model: process.env.HUGGINGFACE_IMAGE_MODEL || selectedModel.modelName || "Qwen/Qwen-Image",
      seed
    });
  }

  if (provider === "xai" && input.type === "image") {
    return generateXAIImage({
      input,
      builtPrompt,
      model: process.env.XAI_IMAGE_MODEL || selectedModel.modelName || "grok-imagine-image",
      seed
    });
  }

  if (provider === "bfl" && input.type === "image") {
    return generateBFLImage({
      input,
      builtPrompt,
      model: process.env.BFL_IMAGE_MODEL || selectedModel.modelName || "flux-2-pro-preview",
      seed
    });
  }

  if (provider === "pollinations" && input.type === "image") {
    return generatePollinationsImage({
      input,
      builtPrompt,
      model: process.env.POLLINATIONS_IMAGE_MODEL || selectedModel.modelName || "flux",
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

function resolveProvider(
  provider: string,
  type: GenerationRequest["type"]
): "mock" | "openai" | "pollinations" | "google" | "stability" | "huggingface" | "xai" | "bfl" {
  if (type === "video") return "mock";
  if (provider === "openai") return "openai";
  if (provider === "google") return "google";
  if (provider === "stability") return "stability";
  if (provider === "huggingface") return "huggingface";
  if (provider === "xai") return "xai";
  if (provider === "bfl") return "bfl";
  if (provider === "pollinations") return "pollinations";
  if (provider === "mock") return "mock";
  if (process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY)) return "openai";
  if (process.env.AI_PROVIDER === "google" && Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) return "google";
  if (process.env.AI_PROVIDER === "stability" && Boolean(process.env.STABILITY_API_KEY)) return "stability";
  if (process.env.AI_PROVIDER === "huggingface" && Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY)) return "huggingface";
  if (process.env.AI_PROVIDER === "xai" && Boolean(process.env.XAI_API_KEY)) return "xai";
  if (process.env.AI_PROVIDER === "bfl" && Boolean(process.env.BFL_API_KEY)) return "bfl";
  if (process.env.AI_PROVIDER === "pollinations") return "pollinations";
  return "mock";
}
