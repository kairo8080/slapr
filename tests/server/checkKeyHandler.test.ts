import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { checkKeyFromPayload } from "@/lib/server/checkKeyHandler";

const originalFetch = globalThis.fetch;

describe("checkKeyFromPayload", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.reset();
  });

  it("rejects missing provider or key", async () => {
    const result = await checkKeyFromPayload({});

    assert.deepEqual(result, {
      ok: false,
      provider: undefined,
      status: "not-working",
      error: "Provider and API key are required."
    });
  });

  it("checks xAI keys against the models endpoint", async () => {
    const fetchMock = mock.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await checkKeyFromPayload({
      provider: "xai",
      apiKey: "test-key"
    });

    assert.deepEqual(result, {
      ok: true,
      provider: "xai",
      status: "working"
    });
    assert.deepEqual(fetchMock.mock.calls[0].arguments, ["https://api.x.ai/v1/models", {
      headers: {
        Authorization: "Bearer test-key"
      }
    }]);
  });

  it("maps provider rejection to a not-working status", async () => {
    globalThis.fetch = mock.fn(async () => new Response("{}", { status: 401 })) as typeof fetch;

    const result = await checkKeyFromPayload({
      provider: "openai",
      apiKey: "bad-key"
    });

    assert.deepEqual(result, {
      ok: false,
      provider: "openai",
      status: "not-working",
      error: "Provider rejected the key check with HTTP 401."
    });
  });
});
