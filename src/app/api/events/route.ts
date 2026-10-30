import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, json, preflight, readJson } from "@/lib/http";
import {
  createEvent,
  findCategory,
  listEvents,
  uniqueSlug,
} from "@/lib/queries";
import { parseEventInput } from "@/lib/validation";
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

  const events = listEvents({
    status,
    category: searchParams.get("category") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });

  return json({ data: events, meta: { total: events.length } });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return fail("Avtorizatsiya talab qilinadi", 401);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const { data, errors } = parseEventInput(body);
  if (Object.keys(errors).length) return fail("Ma'lumotlar to'liq emas", 422, errors);

  const category = findCategory(data.categoryId);
  if (!category || category.kind !== "event") {
    return fail("Tadbir kategoriyasi noto'g'ri", 422, { categoryId: "Kategoriya topilmadi" });
  }

  data.slug = uniqueSlug("events", typeof body.slug === "string" ? body.slug : data.title);
  const event = createEvent(data);
  return json({ data: event }, 201);
}

export function OPTIONS() {
  return preflight();
}
