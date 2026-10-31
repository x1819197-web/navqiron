import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight, readJson } from "@/lib/http";
import {
  deletePlace,
  findCategory,
  getPlaceById,
  getPlaceBySlug,
  uniqueSlug,
  updatePlace,
} from "@/lib/queries";
import { parsePlaceInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolve(idOrSlug: string) {
  const numeric = Number(idOrSlug);
  return Number.isInteger(numeric) && numeric > 0
    ? getPlaceById(numeric)
    : getPlaceBySlug(idOrSlug);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const place = await resolve(id);
  if (!place) return fail("Joy topilmadi", 404);
  if (place.status !== "published") {
    const admin = await getAdminFromRequest(req);
    if (!admin) return fail("Joy topilmadi", 404);
  }
  return json({ data: place });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const { id } = await params;
  const existing = await resolve(id);
  if (!existing) return fail("Joy topilmadi", 404);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const { data, errors } = parsePlaceInput(body, existing);
  if (Object.keys(errors).length) return fail("Ma'lumotlar to'liq emas", 422, errors);

  const category = await findCategory(data.categoryId);
  if (!category || category.kind !== "place") {
    return fail("Joy kategoriyasi noto'g'ri", 422, { categoryId: "Kategoriya topilmadi" });
  }

  data.slug =
    typeof body.slug === "string" && body.slug.trim()
      ? await uniqueSlug("places", body.slug, existing.id)
      : existing.slug;

  const place = await updatePlace(existing.id, data);
  return json({ data: place });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const { id } = await params;
  const existing = await resolve(id);
  if (!existing) return fail("Joy topilmadi", 404);

  await deletePlace(existing.id);
  return json({ ok: true });
}

export function OPTIONS() {
  return preflight();
}
