import { fail, json, preflight } from "@/lib/http";
import { getFriendsOverview } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  return json({ data: await getFriendsOverview(viewer.id) });
}

export function OPTIONS() {
  return preflight();
}
