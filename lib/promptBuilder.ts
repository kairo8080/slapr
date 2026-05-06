import { getStylePreset } from "@/lib/registries/styles";
import { getTemplatePreset } from "@/lib/registries/templates";
import { getTonePreset } from "@/lib/registries/tones";
import {
  getConsistencyPreset,
  getModificationPreset
} from "@/lib/registries/modifications";
import type { BuiltPrompt, GenerationRequest } from "@/lib/types";

export function buildPrompt(input: GenerationRequest): BuiltPrompt {
  const token = input.token.trim();
  const narrative = input.narrative.trim();
  if (input.enhancePrompt === false) {
    return {
      prompt: narrative,
      title: `${token} ${input.type === "video" ? "video prompt" : "visual"}`,
      negativePrompt: "",
      metadata: {
        tone: "raw",
        style: "raw",
        template: input.aspectRatio || "1:1"
      }
    };
  }

  const tone = getTonePreset(input.toneId);
  const style = getStylePreset(input.styleId);
  const template = getTemplatePreset(input.templateId);
  const modification = getModificationPreset(input.modificationId);
  const consistency = getConsistencyPreset(input.consistencyId);
  const characterName = input.characterName?.trim();
  const outputIntent =
    input.type === "video"
      ? "Generate a production-ready short-form video concept with a strong first-frame thumbnail."
      : input.sourceImage
        ? "Edit the uploaded PFP or NFT into one viral-ready crypto social image."
        : "Generate one viral-ready crypto social image.";

  const identityDirection = input.sourceImage
    ? [
        `Reference character: ${characterName || token}.`,
        `Character consistency: ${consistency.prompt}.`,
        "Do not replace the character, change the core face or head, remove signature accessories, or invent a different avatar."
      ]
    : [];

  const prompt = [
    outputIntent,
    `Token or brand: ${token}.`,
    ...identityDirection,
    `Modification: ${modification.prompt}.`,
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
      "blurry text, illegible ticker, fake exchange logos, cluttered UI, dull colors, low resolution, generic stock photo, inconsistent character identity, different face, different avatar",
    metadata: {
      tone: tone.label,
      style: style.label,
      template: `${template.label} ${template.aspect}`
    }
  };
}
