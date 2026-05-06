import { handleGenerate } from "@/lib/server/generateHandler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleGenerate(request);
}

export function GET(): Response {
  return Response.json({ error: "Use POST to generate an image." }, { status: 405 });
}
