import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight, readJson } from "@/lib/http";
import { createPlace, findCategory, listPlaces, uniqueSlug } from "@/lib/queries";
import { parsePlaceInput } from "@/lib/validation";
import type { Status } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedStatus = searchParams.get("status") as Status | "all" | null;

  let status: Status | "all" = "published";
  if (requestedStatus && requestedStatus !== "published") {
    const admin = await getAdminFromRequest(req);
    if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);
    status = requestedStatus;
  }

  const places = await listPlaces({
    status,
    category: searchParams.get("category") ?? undefined,
    query: searchParams.get("q") ?? undefined,
  });

  return json({ data: places, meta: { total: places.length } });
}

export async function POST(req: Request) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const { data, errors } = parsePlaceInput(body);
  if (Object.keys(errors).length) return fail("Ma'lumotlar to'liq emas", 422, errors);

  const category = await findCategory(data.categoryId);
  if (!category || category.kind !== "place") {
    return fail("Joy kategoriyasi noto'g'ri", 422, { categoryId: "Kategoriya topilmadi" });
  }

  data.slug = await uniqueSlug("places", typeof body.slug === "string" ? body.slug : data.name);
  const place = await createPlace(data);
  return json({ data: place }, 201);
}

export function OPTIONS() {
  return preflight();
}
