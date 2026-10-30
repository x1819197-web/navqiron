import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight } from "@/lib/http";
import { getEventById, getEventBySlug, listRegistrations } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const { id } = await params;
  const numeric = Number(id);
  const event = Number.isInteger(numeric) ? getEventById(numeric) : getEventBySlug(id);
  if (!event) return fail("Tadbir topilmadi", 404);

  const registrations = listRegistrations(event.id);
  return json({ data: registrations, meta: { total: registrations.length } });
}

export function OPTIONS() {
  return preflight();
}
