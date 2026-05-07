import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateFromPayload } from "@/lib/server/generateHandler";

describe("generateFromPayload", () => {
  it("normalizes a minimal local image generation request", async () => {
    const result = await generateFromPayload({
      token: "SLAPR",
      narrative: "penguin launch energy",
      type: "image",
      modelId: "mock-character-lock",
      aspectRatio: "16:9"
    });

    assert.equal(result.provider, "slapr-local");
    assert.equal(result.model, "slapr-character-lock-v0");
    assert.equal(result.modelId, "mock-character-lock");
    assert.equal(result.aspectRatio, "16:9");
    assert.match(result.imageUrl, /^data:image\/svg\+xml/);
    assert.equal(result.status, "ready");
  });

  it("rejects requests without a token", async () => {
    await assert.rejects(
      generateFromPayload({
        narrative: "missing token"
      }),
      /Token or brand is required\./
    );
  });
});
