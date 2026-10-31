import { fail, json, preflight, readJson } from "@/lib/http";
import { clearFreeStatus, getFreeStatus, setFreeStatus } from "@/lib/friends";
import { getUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  return json({ data: { freeStatus: getFreeStatus(viewer.id) } });
}

export async function PUT(req: Request) {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const hours = typeof body.hours === "number" ? body.hours : 2;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 12) {
    return fail("Davomiylik noto'g'ri", 422);
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 80) : "";
  const lat = typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
  const lng = typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;

  const freeStatus = setFreeStatus(viewer.id, hours, note, lat, lng);
  return json({ data: { freeStatus } });
}

export async function DELETE() {
  const viewer = await getUserSession();
  if (!viewer) return fail("Avval tizimga kiring", 401);
  clearFreeStatus(viewer.id);
  return json({ data: { freeStatus: null } });
}

export function OPTIONS() {
  return preflight();
}
