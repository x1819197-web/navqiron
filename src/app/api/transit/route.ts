import { json, preflight } from "@/lib/http";
import { getTransitStops } from "@/lib/transit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const stops = await getTransitStops();
  return json({ data: stops, meta: { total: stops.length } });
}

export function OPTIONS() {
  return preflight();
}
