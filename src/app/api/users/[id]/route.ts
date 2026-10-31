import { fail, json, preflight } from "@/lib/http";
import { getPublicUser } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  const { id } = await params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return fail("Foydalanuvchi topilmadi", 404);
  }
  const user = getPublicUser(viewer.id, targetId);
  if (!user) return fail("Foydalanuvchi topilmadi", 404);
  return json({ data: user });
}

export function OPTIONS() {
  return preflight();
}
