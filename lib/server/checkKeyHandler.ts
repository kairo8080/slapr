import type { ApiError, CredentialProvider } from "@/lib/types";

type CheckKeyPayload = {
  provider?: string;
  apiKey?: string;
};

type CheckKeyResult = {
  ok: boolean;
  provider?: string;
  status: "working" | "not-working";
  error?: string;
};

export async function handleCheckKey(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST to check an API key." } satisfies ApiError, {
      status: 405
    });
  }

  try {
    const body = (await request.json()) as CheckKeyPayload;
    const result = await checkKeyFromPayload(body);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "not-working",
        error: error instanceof Error ? error.message : "API key check failed."
      } satisfies CheckKeyResult,
      { status: 400 }
    );
  }
}

export async function checkKeyFromPayload(body: CheckKeyPayload): Promise<CheckKeyResult> {
  const provider = normalizeProvider(body.provider);
  const apiKey = normalizeSecret(body.apiKey);
  if (!provider || !apiKey) {
    return {
      ok: false,
      provider,
      status: "not-working",
      error: "Provider and API key are required."
    };
  }

  return checkProviderKey(provider, apiKey);
}

async function checkProviderKey(
  provider: CredentialProvider,
  apiKey: string
): Promise<CheckKeyResult> {
  if (provider === "xai") {
    return checkJsonEndpoint(provider, "https://api.x.ai/v1/models", {
      Authorization: `Bearer ${apiKey}`
    });
  }
  if (provider === "openai") {
    return checkJsonEndpoint(provider, "https://api.openai.com/v1/models", {
      Authorization: `Bearer ${apiKey}`
    });
  }
  if (provider === "google") {
    return checkJsonEndpoint(
      provider,
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {}
    );
  }
  if (provider === "stability") {
    return checkJsonEndpoint(provider, "https://api.stability.ai/v1/user/account", {
      Authorization: `Bearer ${apiKey}`
    });
  }
  if (provider === "huggingface") {
    return checkJsonEndpoint(provider, "https://huggingface.co/api/whoami-v2", {
      Authorization: `Bearer ${apiKey}`
    });
  }

  return checkJsonEndpoint(provider, "https://api.bfl.ai/v1/credits", {
    "x-key": apiKey
  });
}

async function checkJsonEndpoint(
  provider: CredentialProvider,
  url: string,
  headers: Record<string, string>
): Promise<CheckKeyResult> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    return {
      ok: false,
      provider,
      status: "not-working",
      error: `Provider rejected the key check with HTTP ${response.status}.`
    };
  }

  return {
    ok: true,
    provider,
    status: "working"
  };
}

function normalizeProvider(value: unknown): CredentialProvider | undefined {
  return value === "openai" ||
    value === "google" ||
    value === "stability" ||
    value === "huggingface" ||
    value === "xai" ||
    value === "bfl"
    ? value
    : undefined;
}

function normalizeSecret(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 4096) : "";
}
