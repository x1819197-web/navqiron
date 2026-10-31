import { fail, json, preflight, readJson } from "@/lib/http";
import { listNotifications, markNotificationsRead } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  return json({ data: listNotifications(viewer.id) });
}

export async function POST(req: Request) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  const body = (await readJson(req)) ?? {};
  const id = typeof body.id === "number" ? Math.floor(body.id) : undefined;
  markNotificationsRead(viewer.id, id);
  return json({ data: { ok: true } });
}

export function OPTIONS() {
  return preflight();
}
