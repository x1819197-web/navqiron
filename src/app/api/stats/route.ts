import { json, preflight } from "@/lib/http";
import { getStats } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ data: await getStats() });
}

export function OPTIONS() {
  return preflight();
}
