import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const maxBodyBytes = 12 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    if (url.pathname === "/api/generate") {
      await handleGenerate(request, response);
      return;
    }
    if (url.pathname === "/api/check-key") {
      await handleCheckKey(request, response);
      return;
    }
    await serveStatic(url.pathname, response);
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Server error." });
  }
}).listen(port, host, () => {
  console.log(`SLAPR local server on http://${host}:${port}`);
});

async function handleGenerate(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Use POST to generate an image." });
    return;
  }

  const body = await readJson(request);
  const modelId = typeof body.modelId === "string" ? body.modelId : "";
  const provider = getProviderFromRequest(body, modelId);

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const prompt = getPromptFromRequest(body);
  if (!apiKey) {
    writeJson(response, 400, {
      error:
        provider === "xai"
          ? "Grok / xAI key required. Add it in the API tab or set XAI_API_KEY before starting the server."
          : "OpenAI API key is missing."
    });
    return;
  }
  if (!prompt) {
    writeJson(response, 400, { error: "Prompt is missing." });
    return;
  }

  if (provider === "xai") {
    const sourceImage = normalizeImage(body.sourceImage);
    const aspectRatio = normalizeAspectRatio(body.aspectRatio);
    const result = await generateXAI({
      apiKey,
      prompt: buildPrompt(body, Boolean(sourceImage), aspectRatio),
      image: sourceImage,
      model: "grok-imagine-image",
      modelId: modelId || "xai-grok-imagine",
      aspectRatio,
      seed: typeof body.seed === "string" && body.seed ? body.seed : `${Date.now()}`
    });
    writeJson(response, 200, result);
    return;
  }

  if (provider === "openai") {
    const result = await generateOpenAI({
      apiKey,
      prompt,
      image: normalizeImage(body.image || body.sourceImage),
      model: typeof body.model === "string" && body.model.trim() ? body.model.trim() : "gpt-image-1.5"
    });
    writeJson(response, 200, result);
    return;
  }

  writeJson(response, 400, {
    error: "This local server currently supports Grok Imagine Image and OpenAI image models."
  });
}

async function handleCheckKey(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Use POST to check an API key." });
    return;
  }

  const body = await readJson(request);
  const provider = typeof body.provider === "string" ? body.provider : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!provider || !apiKey) {
    writeJson(response, 400, { ok: false, provider, status: "not-working", error: "Provider and API key are required." });
    return;
  }

  const result = await checkProviderKey(provider, apiKey);
  writeJson(response, result.ok ? 200 : 400, result);
}

async function checkProviderKey(provider, apiKey) {
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
  if (provider === "bfl") {
    return checkJsonEndpoint(provider, "https://api.bfl.ai/v1/credits", {
      "x-key": apiKey
    });
  }

  return {
    ok: false,
    provider,
    status: "not-working",
    error: "Provider key checks are not wired for this provider."
  };
}

async function checkJsonEndpoint(provider, url, headers) {
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

function getProviderFromRequest(body, modelId) {
  if (typeof body.provider === "string" && body.provider) return body.provider;
  if (modelId === "xai-grok-imagine") return "xai";
  if (modelId.startsWith("openai-")) return "openai";
  return "";
}

function getPromptFromRequest(body) {
  if (typeof body.prompt === "string" && body.prompt.trim()) return body.prompt.trim();
  if (typeof body.narrative === "string" && body.narrative.trim()) return body.narrative.trim();
  return "";
}

async function generateOpenAI({ apiKey, prompt, image, model }) {
  const hasImage = Boolean(image?.dataUrl);
  const response = hasImage
    ? await postOpenAIEdit({ apiKey, prompt, image, model })
    : await postOpenAIGeneration({ apiKey, prompt, model });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || `OpenAI returned ${response.status}.`);
  }

  const imageResult = payload?.data?.[0];
  const imageUrl = imageResult?.b64_json
    ? `data:image/png;base64,${imageResult.b64_json}`
    : imageResult?.url;
  if (!imageUrl) {
    throw new Error("OpenAI response did not include an image.");
  }

  return {
    imageUrl,
    model,
    note: hasImage
      ? `OpenAI ${model} edited from uploaded image input.`
      : `OpenAI ${model} generated from text input.`
  };
}

async function generateXAI({ apiKey, prompt, image, model, modelId, aspectRatio, seed }) {
  const response = image?.dataUrl
    ? await postXAIEdit({ apiKey, prompt, image, model, aspectRatio })
    : await postXAIGeneration({ apiKey, prompt, model, aspectRatio });
  const text = await response.text();
  const payload = parseJson(text);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        (typeof payload?.error === "string" ? payload.error : "") ||
        payload?.message ||
        text.slice(0, 240) ||
        `xAI request failed with HTTP ${response.status}.`
    );
  }

  const imageResult = payload?.data?.[0];
  const imageUrl = imageResult?.b64_json
    ? `data:${mimeFromBase64(imageResult.b64_json)};base64,${imageResult.b64_json}`
    : imageResult?.url;
  if (!imageUrl) {
    throw new Error("xAI response did not include an image.");
  }

  return {
    imageUrl,
    prompt: imageResult?.revised_prompt || prompt,
    provider: "xai",
    model,
    modelId,
    type: "image",
    seed,
    sourceImageUrl: image?.dataUrl,
    aspectRatio,
    status: "ready",
    notes: [
      image?.dataUrl
        ? "Edited from the uploaded source image through xAI Grok Imagine."
        : "Generated through xAI Grok Imagine."
    ]
  };
}

async function postXAIGeneration({ apiKey, prompt, model, aspectRatio }) {
  return fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      response_format: "b64_json",
      aspect_ratio: toXAIAspectRatio(aspectRatio)
    })
  });
}

async function postXAIEdit({ apiKey, prompt, image, model, aspectRatio }) {
  return fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      image: {
        type: "image_url",
        url: image.dataUrl
      },
      response_format: "b64_json",
      aspect_ratio: toXAIAspectRatio(aspectRatio)
    })
  });
}

async function postOpenAIGeneration({ apiKey, prompt, model }) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "low",
      output_format: "png"
    })
  });
}

async function postOpenAIEdit({ apiKey, prompt, image, model }) {
  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");
  formData.append("quality", "low");
  formData.append("output_format", "png");
  formData.append("image", dataUrlToBlob(image.dataUrl, image.mimeType), image.name || "slapr-source.png");

  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });
}

async function serveStatic(pathname, response) {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);
  const ext = extname(filePath);
  const content = await readFile(filePath);
  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  response.end(content);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Request is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function normalizeImage(image) {
  if (!image || typeof image !== "object") return null;
  if (typeof image.dataUrl !== "string" || typeof image.mimeType !== "string") return null;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(image.dataUrl)) return null;
  return {
    dataUrl: image.dataUrl,
    mimeType: image.mimeType,
    name: typeof image.name === "string" ? image.name.replace(/[^\w.-]+/g, "_").slice(0, 96) : "slapr-source.png"
  };
}

function normalizeAspectRatio(value) {
  return ["1:1", "16:9", "9:16", "21:9"].includes(value) ? value : "1:1";
}

function toXAIAspectRatio(aspectRatio) {
  return aspectRatio === "21:9" ? "20:9" : aspectRatio || "1:1";
}

function buildPrompt(input, hasSourceImage, aspectRatio) {
  const narrative = getPromptFromRequest(input) || "Create a bold gm crypto profile image.";
  if (input.enhancePrompt === false) return narrative;

  const sourceInstruction = hasSourceImage
    ? "Preserve the uploaded PFP/NFT character identity, silhouette, and recognizable traits."
    : "Create a strong central character suitable for a crypto profile image.";

  return [
    narrative,
    sourceInstruction,
    `${aspectRatio} composition, clean terminal-inspired NFT feed aesthetic, high contrast, crisp subject, simple background, production-ready image.`,
    "Avoid text artifacts, extra logos, watermarks, distorted faces, and clutter."
  ].join("\n");
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mimeFromBase64(base64) {
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function dataUrlToBlob(dataUrl, mimeType) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Uploaded image data is invalid.");
  return new Blob([Buffer.from(base64, "base64")], { type: mimeType });
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}
