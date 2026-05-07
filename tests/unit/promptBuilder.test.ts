import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPrompt } from "@/lib/promptBuilder";
import type { GenerationRequest } from "@/lib/types";

const baseRequest: GenerationRequest = {
  token: "SLAPR",
  narrative: "penguin launch energy",
  toneId: "degen",
  styleId: "meme-terminal",
  templateId: "square-post",
  type: "image",
  modelId: "mock-character-lock",
  modificationId: "pfp-remix",
  consistencyId: "strict",
  aspectRatio: "1:1",
  enhancePrompt: true
};

describe("buildPrompt", () => {
  it("builds an enhanced crypto image prompt with metadata", () => {
    const result = buildPrompt(baseRequest);

    assert.match(result.prompt, /Token or brand: SLAPR\./);
    assert.match(result.prompt, /Narrative: penguin launch energy\./);
    assert.match(result.prompt, /Audience: crypto-native traders/);
    assert.match(result.negativePrompt, /blurry text/);
    assert.deepEqual(result.metadata, {
      tone: "Degen",
      style: "Meme Terminal",
      template: "Square 1:1"
    });
  });

  it("returns raw prompt content when enhancement is disabled", () => {
    const result = buildPrompt({
      ...baseRequest,
      narrative: "just the raw prompt",
      enhancePrompt: false
    });

    assert.equal(result.prompt, "just the raw prompt");
    assert.equal(result.negativePrompt, "");
    assert.equal(result.metadata.template, "1:1");
  });
});
