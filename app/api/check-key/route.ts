import { handleCheckKey } from "@/lib/server/checkKeyHandler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleCheckKey(request);
}

export function GET(): Response {
  return Response.json({ error: "Use POST to check an API key." }, { status: 405 });
}
