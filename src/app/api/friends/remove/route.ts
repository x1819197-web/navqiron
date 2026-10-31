import { fail, json, preflight, readJson } from "@/lib/http";
import { removeFriend } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);
  const userId = typeof body.userId === "number" ? Math.floor(body.userId) : 0;
  if (!userId) return fail("Foydalanuvchi tanlanmadi", 422);

  if (!(await removeFriend(viewer.id, userId))) return fail("Do'stlik topilmadi", 404);
  return json({ data: { ok: true } });
}

export function OPTIONS() {
  return preflight();
}
