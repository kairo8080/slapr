#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const staticRoot = resolve(repoRoot, "out");
const port = getPort();
const host = "127.0.0.1";
const maxBodyBytes = 12 * 1024 * 1024;
const xaiModel = "grok-imagine-image";
const aspectRatios = new Set(["1:1", "16:9", "9:16", "21:9"]);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/generate") {
      await handleGenerate(request, response);
      return;
    }

    if (path === "/api/check-key") {
      await handleCheckKey(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(url.pathname, response, request.method === "HEAD");
      return;
    }

    writeJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local server error.";
    writeJson(response, 500, { error: message });
  }
});

server.listen(port, host, () => {
  console.log(`SLAPR local Grok server listening at http://${host}:${port}`);
  console.log("Use the API tab to add an xAI key, then select Grok Imagine Image.");
});

async function handleGenerate(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Use POST to generate an image." });
    return;
  }

  try {
    const input = await readJsonBody(request);
    const modelId = typeof input.modelId === "string" ? input.modelId : "";
    if (modelId !== "xai-grok-imagine") {
      writeJson(response, 400, {
        error: "This local API server currently supports Grok Imagine Image only."
      });
      return;
    }

    const apiKey = normalizeSecret(input.apiKey) || process.env.XAI_API_KEY;
    if (!apiKey) {
      writeJson(response, 400, {
        error: "Grok / xAI key required. Add it in the API tab or set XAI_API_KEY before starting the server."
      });
      return;
    }

    const sourceImage = normalizeSourceImage(input.sourceImage);
    const aspectRatio = normalizeAspectRatio(input.aspectRatio);
    const prompt = buildPrompt(input, Boolean(sourceImage), aspectRatio);
    const xaiAspectRatio = toXaiAspectRatio(aspectRatio);
    const xaiResponse = sourceImage
      ? await callXaiEdit(apiKey, prompt, sourceImage.dataUrl, xaiAspectRatio)
      : await callXaiGeneration(apiKey, prompt, xaiAspectRatio);

    const image = xaiResponse?.data?.[0];
    const imageUrl = await resolveImageUrl(image);
    if (!imageUrl) {
      throw new Error("xAI returned no image URL or base64 image.");
    }

    writeJson(response, 200, {
      imageUrl,
      prompt: image?.revised_prompt || prompt,
      provider: "xai",
      model: xaiModel,
      modelId,
      type: "image",
      seed: typeof input.seed === "string" && input.seed ? input.seed : randomUUID(),
      sourceImageUrl: sourceImage?.dataUrl,
      aspectRatio,
      status: "ready",
      notes: [
        sourceImage
          ? "Edited from the uploaded source image through xAI Grok Imagine."
          : "Generated through xAI Grok Imagine."
      ]
    });
  } catch (error) {
    writeJson(response, 400, {
      error: error instanceof Error ? error.message : "Grok image generation failed."
    });
  }
}

async function handleCheckKey(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Use POST to check an API key." });
    return;
  }

  try {
    const input = await readJsonBody(request);
    const provider = typeof input.provider === "string" ? input.provider : "";
    const apiKey = normalizeSecret(input.apiKey);
    if (!provider || !apiKey) {
      writeJson(response, 400, { error: "Provider and API key are required." });
      return;
    }

    const result = await checkProviderKey(provider, apiKey);
    writeJson(response, result.ok ? 200 : 400, result);
  } catch (error) {
    writeJson(response, 400, {
      ok: false,
      status: "not-working",
      error: error instanceof Error ? error.message : "API key check failed."
    });
  }
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

async function callXaiGeneration(apiKey, prompt, aspectRatio) {
  return postXai(apiKey, "https://api.x.ai/v1/images/generations", {
    model: xaiModel,
    prompt,
    response_format: "b64_json",
    aspect_ratio: aspectRatio
  });
}

async function callXaiEdit(apiKey, prompt, imageUrl, aspectRatio) {
  return postXai(apiKey, "https://api.x.ai/v1/images/edits", {
    model: xaiModel,
    prompt,
    image: {
      type: "image_url",
      url: imageUrl
    },
    response_format: "b64_json",
    aspect_ratio: aspectRatio
  });
}

async function postXai(apiKey, url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  const payload = parseJson(text);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      text.slice(0, 240) ||
      `xAI request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

async function resolveImageUrl(image) {
  if (!image) return "";
  if (typeof image.b64_json === "string" && image.b64_json) {
    return `data:${mimeFromBase64(image.b64_json)};base64,${image.b64_json}`;
  }
  if (typeof image.url === "string" && image.url) {
    return inlineRemoteImage(image.url);
  }
  return "";
}

function mimeFromBase64(base64) {
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

async function inlineRemoteImage(url) {
  const response = await fetch(url);
  if (!response.ok) return url;
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
}

function buildPrompt(input, hasSourceImage, aspectRatio) {
  const narrative =
    typeof input.narrative === "string" && input.narrative.trim()
      ? input.narrative.trim().slice(0, 1200)
      : "Create a bold gm crypto profile image.";
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

function normalizeAspectRatio(value) {
  return typeof value === "string" && aspectRatios.has(value) ? value : "1:1";
}

function toXaiAspectRatio(aspectRatio) {
  // xAI exposes 20:9 as its ultrawide enum; the UI keeps 21:9 as the user-facing label.
  return aspectRatio === "21:9" ? "20:9" : aspectRatio;
}

function normalizeSourceImage(value) {
  if (!value || typeof value !== "object") return undefined;
  if (typeof value.dataUrl !== "string") return undefined;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(value.dataUrl)) return undefined;
  return {
    dataUrl: value.dataUrl,
    name: typeof value.name === "string" ? value.name.slice(0, 120) : "source-image",
    mimeType: typeof value.mimeType === "string" ? value.mimeType.slice(0, 32) : "image/png"
  };
}

function normalizeSecret(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 4096);
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error("Uploaded payload is too large.");
    }
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  const payload = parseJson(text);
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be valid JSON.");
  }
  return payload;
}

async function serveStatic(pathname, response, headOnly) {
  const filePath = await resolveStaticPath(pathname);
  if (!filePath) {
    writeJson(response, 404, { error: "File not found." });
    return;
  }

  const fileStat = await stat(filePath);
  response.statusCode = 200;
  response.setHeader("Content-Length", fileStat.size);
  response.setHeader("Content-Type", mimeTypes.get(extname(filePath)) || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");

  if (headOnly) {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

async function resolveStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath =
    decoded === "/" || decoded.endsWith("/")
      ? `${decoded.replace(/^\/+/, "")}index.html`
      : decoded.replace(/^\/+/, "");
  const filePath = resolve(staticRoot, relativePath);
  if (!(filePath === staticRoot || filePath.startsWith(`${staticRoot}${sep}`))) {
    throw new Error("Invalid static path.");
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) return filePath;
  } catch {
    if (!extname(relativePath)) {
      const fallback = resolve(staticRoot, "index.html");
      const fallbackStat = await stat(fallback).catch(() => null);
      if (fallbackStat?.isFile()) return fallback;
    }
  }
  return "";
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function writeJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function getPort() {
  const portIndex = process.argv.indexOf("--port");
  const value = portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT;
  const parsed = Number(value || 3000);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}
