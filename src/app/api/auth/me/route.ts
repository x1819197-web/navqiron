import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);
  return json({ data: { admin } });
}

export function OPTIONS() {
  return preflight();
}
