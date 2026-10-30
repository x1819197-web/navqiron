import { fail, json, preflight, readJson } from "@/lib/http";
import { getEventById, getEventBySlug, registerForEvent } from "@/lib/queries";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numeric = Number(id);
  const event = Number.isInteger(numeric)
    ? getEventById(numeric)
    : getEventBySlug(id);
  if (!event) return fail("Tadbir topilmadi", 404);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const phone = normalizePhone(rawPhone);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Ism-familiyani kiriting";
  if (!phone) errors.phone = "Telefon raqam noto'g'ri (masalan: 90 123 45 67)";
  if (Object.keys(errors).length) return fail("Ma'lumotlarni tekshiring", 422, errors);

  const result = registerForEvent(event.id, name, phone!);
  if (!result.ok) {
    return fail(result.message, result.code === "not_found" ? 404 : 409);
  }

  return json(
    {
      data: {
        registered: result.registered,
        capacity: result.capacity,
        message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!",
      },
    },
    201,
  );
}

export function OPTIONS() {
  return preflight();
}
