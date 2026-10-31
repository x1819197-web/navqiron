import type { NextRequest } from "next/server";
import { fail, json, preflight, readJson } from "@/lib/http";
import { sendFriendRequest } from "@/lib/friends";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findUserByPhone } from "@/lib/users";
import { getUserSession } from "@/lib/user-auth";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  if (rateLimit(`friend-request:${viewer.id}:${clientIp(req)}`, 20, 10 * 60_000)) {
    return fail("Juda ko'p so'rov. Birozdan so'ng urinib ko'ring.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  let targetId = typeof body.userId === "number" ? Math.floor(body.userId) : 0;
  if (!targetId && typeof body.phone === "string") {
    const phone = normalizePhone(body.phone);
    const user = phone ? await findUserByPhone(phone) : null;
    if (!user) return fail("Bu raqam bilan foydalanuvchi topilmadi", 404);
    targetId = user.id;
  }
  if (!targetId) return fail("Foydalanuvchini tanlang", 422);

  const result = await sendFriendRequest(viewer.id, targetId);
  if (!result.ok) return fail(result.message, result.code === "blocked" ? 403 : 404);
  return json({ data: { relation: result.relation } });
}

export function OPTIONS() {
  return preflight();
}
