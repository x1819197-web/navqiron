import type { NextRequest } from "next/server";
import { fail, json, preflight, readJson } from "@/lib/http";
import { inviteFriendToEvent } from "@/lib/friends";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  if (rateLimit(`friend-invite:${viewer.id}:${clientIp(req)}`, 30, 10 * 60_000)) {
    return fail("Juda ko'p taklif. Birozdan so'ng urinib ko'ring.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);
  const friendId = typeof body.friendId === "number" ? Math.floor(body.friendId) : 0;
  const eventId = typeof body.eventId === "number" ? Math.floor(body.eventId) : 0;
  if (!friendId || !eventId) return fail("Do'st va tadbirni tanlang", 422);

  const result = inviteFriendToEvent(viewer.id, friendId, eventId);
  if (!result.ok) return fail(result.message, 400);
  return json({ data: { ok: true } });
}

export function OPTIONS() {
  return preflight();
}
