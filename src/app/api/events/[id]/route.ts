import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight, readJson } from "@/lib/http";
import {
  deleteEvent,
  findCategory,
  getEventById,
  getEventBySlug,
  uniqueSlug,
  updateEvent,
} from "@/lib/queries";
import { parseEventInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolve(idOrSlug: string) {
  const numeric = Number(idOrSlug);
  return Number.isInteger(numeric) && numeric > 0
    ? getEventById(numeric)
    : getEventBySlug(idOrSlug);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const event = await resolve(id);
  if (!event) return fail("Tadbir topilmadi", 404);
  if (event.status !== "published") {
    const admin = await getAdminFromRequest(req);
    if (!admin) return fail("Tadbir topilmadi", 404);
  }
  return json({ data: event });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const { id } = await params;
  const existing = await resolve(id);
  if (!existing) return fail("Tadbir topilmadi", 404);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const { data, errors } = parseEventInput(body, existing);
  if (Object.keys(errors).length) return fail("Ma'lumotlar to'liq emas", 422, errors);

  const category = await findCategory(data.categoryId);
  if (!category || category.kind !== "event") {
    return fail("Tadbir kategoriyasi noto'g'ri", 422, { categoryId: "Kategoriya topilmadi" });
  }

  data.slug =
    typeof body.slug === "string" && body.slug.trim()
      ? await uniqueSlug("events", body.slug, existing.id)
      : existing.slug;

  const event = await updateEvent(existing.id, data);
  return json({ data: event });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const { id } = await params;
  const existing = await resolve(id);
  if (!existing) return fail("Tadbir topilmadi", 404);

  await deleteEvent(existing.id);
  return json({ ok: true });
}

export function OPTIONS() {
  return preflight();
}
