import { handleGenerate } from "@/lib/server/generateHandler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleGenerate(request);
}
