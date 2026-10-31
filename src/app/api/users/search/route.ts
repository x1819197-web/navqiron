import type { NextRequest } from "next/server";
import { fail, json, preflight } from "@/lib/http";
import { searchUsers } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  const query = req.nextUrl.searchParams.get("q") ?? "";
  return json({ data: searchUsers(viewer.id, query) });
}

export function OPTIONS() {
  return preflight();
}
