import { getStylePreset } from "@/lib/registries/styles";
import { getTemplatePreset } from "@/lib/registries/templates";
import { getTonePreset } from "@/lib/registries/tones";
import type { BuiltPrompt, GenerationRequest } from "@/lib/types";

export function buildPrompt(input: GenerationRequest): BuiltPrompt {
  const token = input.token.trim();
  const narrative = input.narrative.trim();
  const tone = getTonePreset(input.toneId);
  const style = getStylePreset(input.styleId);
  const template = getTemplatePreset(input.templateId);
  const outputIntent =
    input.type === "video"
      ? "Generate a production-ready short-form video concept with a strong first-frame thumbnail."
      : "Generate one viral-ready crypto social image.";

  const prompt = [
    outputIntent,
    `Token or brand: ${token}.`,
    `Narrative: ${narrative}.`,
    `Tone: ${tone.prompt}.`,
    `Visual style: ${style.prompt}.`,
    `Template: ${template.prompt}.`,
    "Audience: crypto-native traders, founders, meme pages, and on-chain communities.",
    "Make the composition readable in a social feed, with bold hierarchy, strong contrast, and no tiny body text.",
    "Use ticker-aware visual language without copying any existing brand artwork or protected logos."
  ].join(" ");

  return {
    prompt,
    title: `${token} ${input.type === "video" ? "video prompt" : "visual"}`,
    negativePrompt:
      "blurry text, illegible ticker, fake exchange logos, cluttered UI, dull colors, low resolution, generic stock photo",
    metadata: {
      tone: tone.label,
      style: style.label,
      template: `${template.label} ${template.aspect}`
    }
  };
}
