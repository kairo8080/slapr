import type { IncomingMessage, ServerResponse } from "node:http";
import { generateFromPayload } from "../lib/server/generateHandler";
import type { ApiError, GenerationRequest } from "../lib/types";

const MAX_BODY_BYTES = 8 * 1024 * 1024;

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Use POST to generate an image." });
    return;
  }

  try {
    const body = (await readJsonBody(request)) as Partial<GenerationRequest>;
    const result = await generateFromPayload(body);
    writeJson(response, 200, result);
  } catch (error) {
    writeJson(response, 400, {
      error: error instanceof Error ? error.message : "Generation failed."
    });
  }
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Uploaded payload is too large."));
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

function writeJson(response: ServerResponse, statusCode: number, payload: ApiError | unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}
