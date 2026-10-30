import type { EventItem, PlaceItem, Status } from "./types";
import type { EventWrite, PlaceWrite } from "./queries";

export type Errors = Record<string, string>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function boolish(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).toLowerCase();
  return !["false", "0", "yoq", "no"].includes(normalized);
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) raw += ":00+05:00";
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) raw += "+05:00";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseEventInput(
  body: Record<string, unknown>,
  existing?: EventItem | null,
): { data: EventWrite; errors: Errors } {
  const errors: Errors = {};

  const title = text(body.title) || existing?.title || "";
  if (title.length < 3) errors.title = "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak";

  const categoryId = Number(body.categoryId ?? existing?.categoryId ?? 0);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Kategoriyani tanlang";
  }

  const lat = Number(body.lat ?? existing?.lat);
  const lng = Number(body.lng ?? existing?.lng);
  if (!Number.isFinite(lat) || lat < 41.0 || lat > 41.6) {
    errors.lat = "Kenglik (lat) 41.0 – 41.6 oralig'ida bo'lishi kerak";
  }
  if (!Number.isFinite(lng) || lng < 69.1 || lng > 69.5) {
    errors.lng = "Uzunlik (lng) 69.1 – 69.5 oralig'ida bo'lishi kerak";
  }

  const startsAt = isoDate(body.startsAt ?? existing?.startsAt);
  if (!startsAt) errors.startsAt = "Boshlanish sanasini kiriting";
  const endsAt = body.endsAt === null || body.endsAt === "" ? null : isoDate(body.endsAt ?? existing?.endsAt);
  if (body.endsAt && !endsAt) errors.endsAt = "Tugash sanasi noto'g'ri";
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    errors.endsAt = "Tugash sanasi boshlanishdan keyin bo'lishi kerak";
  }

  const capacity = nullableNumber(body.capacity ?? existing?.capacity);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    errors.capacity = "Sig'im butun musbat son bo'lishi kerak";
  }

  const statusValue = text(body.status) || existing?.status || "published";
  const status: Status = statusValue === "draft" ? "draft" : "published";

  const data: EventWrite = {
    slug: "",
    title,
    description: text(body.description) || existing?.description || "",
    categoryId,
    lat,
    lng,
    venue: text(body.venue) || existing?.venue || "",
    address: text(body.address) || existing?.address || "",
    startsAt: startsAt ?? new Date().toISOString(),
    endsAt,
    organizer: text(body.organizer) || existing?.organizer || "",
    isFree: boolish(body.isFree, existing?.isFree ?? true),
    price: text(body.price) || null,
    capacity,
    registered: existing?.registered ?? 0,
    status,
  };

  return { data, errors };
}

export function parsePlaceInput(
  body: Record<string, unknown>,
  existing?: PlaceItem | null,
): { data: PlaceWrite; errors: Errors } {
  const errors: Errors = {};

  const name = text(body.name) || existing?.name || "";
  if (name.length < 2) errors.name = "Nomi kamida 2 ta belgidan iborat bo'lishi kerak";

  const categoryId = Number(body.categoryId ?? existing?.categoryId ?? 0);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Kategoriyani tanlang";
  }

  const lat = Number(body.lat ?? existing?.lat);
  const lng = Number(body.lng ?? existing?.lng);
  if (!Number.isFinite(lat) || lat < 41.0 || lat > 41.6) {
    errors.lat = "Kenglik (lat) 41.0 – 41.6 oralig'ida bo'lishi kerak";
  }
  if (!Number.isFinite(lng) || lng < 69.1 || lng > 69.5) {
    errors.lng = "Uzunlik (lng) 69.1 – 69.5 oralig'ida bo'lishi kerak";
  }

  const statusValue = text(body.status) || existing?.status || "published";

  const data: PlaceWrite = {
    slug: "",
    name,
    description: text(body.description) || existing?.description || "",
    categoryId,
    lat,
    lng,
    address: text(body.address) || existing?.address || "",
    workingHours: text(body.workingHours) || null,
    phone: text(body.phone) || null,
    url: text(body.url) || null,
    status: statusValue === "draft" ? "draft" : "published",
  };

  return { data, errors };
}

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return null;
}
