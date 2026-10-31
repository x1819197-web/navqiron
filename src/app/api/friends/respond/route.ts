import { fail, json, preflight, readJson } from "@/lib/http";
import { respondToRequest } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);
  const id = typeof body.id === "number" ? Math.floor(body.id) : 0;
  const action = typeof body.action === "string" ? body.action : "";
  if (!id || (action !== "accept" && action !== "decline")) {
    return fail("So'rov ma'lumotlari noto'g'ri", 422);
  }

  const ok = respondToRequest(viewer.id, id, action === "accept");
  if (!ok) return fail("So'rov topilmadi", 404);
  return json({ data: { ok: true } });
}

export function OPTIONS() {
  return preflight();
}
