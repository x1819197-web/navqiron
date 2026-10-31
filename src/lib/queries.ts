import { getDb, type QueryRow } from "./db";
import type {
  AdminUser,
  Category,
  CategoryKind,
  EventItem,
  PlaceItem,
  Registration,
  Stats,
  Status,
} from "./types";

type Row = QueryRow;

const EVENT_SELECT = `
  SELECT e.*,
         c.slug AS cat_slug,
         c.name AS cat_name,
         c.color AS cat_color,
         c.icon AS cat_icon,
         c.kind AS cat_kind
  FROM events e
  JOIN categories c ON c.id = e.category_id
`;

const PLACE_SELECT = `
  SELECT p.*,
         c.slug AS cat_slug,
         c.name AS cat_name,
         c.color AS cat_color,
         c.icon AS cat_icon,
         c.kind AS cat_kind
  FROM places p
  JOIN categories c ON c.id = p.category_id
`;

const num = (value: unknown, fallback = 0) => Number(value ?? fallback);
const str = (value: unknown, fallback = "") => (value == null ? fallback : String(value));
const nullableStr = (value: unknown) => (value == null || value === "" ? null : String(value));

function categoryFrom(row: Row): Category {
  return {
    id: num(row.category_id),
    slug: str(row.cat_slug),
    name: str(row.cat_name),
    color: str(row.cat_color),
    icon: str(row.cat_icon),
    kind: str(row.cat_kind) as CategoryKind,
  };
}

function mapEvent(row: Row): EventItem {
  return {
    id: num(row.id),
    slug: str(row.slug),
    title: str(row.title),
    description: str(row.description),
    categoryId: num(row.category_id),
    lat: num(row.lat),
    lng: num(row.lng),
    venue: str(row.venue),
    address: str(row.address),
    startsAt: str(row.starts_at),
    endsAt: nullableStr(row.ends_at),
    organizer: str(row.organizer),
    isFree: num(row.is_free) === 1,
    price: nullableStr(row.price),
    capacity: row.capacity == null ? null : num(row.capacity),
    registered: num(row.registered),
    status: str(row.status, "published") as Status,
    createdAt: str(row.created_at),
    category: categoryFrom(row),
  };
}

function mapPlace(row: Row): PlaceItem {
  return {
    id: num(row.id),
    slug: str(row.slug),
    name: str(row.name),
    description: str(row.description),
    categoryId: num(row.category_id),
    lat: num(row.lat),
    lng: num(row.lng),
    address: str(row.address),
    workingHours: nullableStr(row.working_hours),
    phone: nullableStr(row.phone),
    url: nullableStr(row.url),
    status: str(row.status, "published") as Status,
    createdAt: str(row.created_at),
    category: categoryFrom(row),
  };
}

export async function listCategories(kind?: CategoryKind): Promise<Category[]> {
  const db = await getDb();
  const rows = kind
    ? await db.all("SELECT * FROM categories WHERE kind = ? ORDER BY sort, id", kind)
    : await db.all("SELECT * FROM categories ORDER BY kind, sort, id");
  return rows.map((row) => ({
    id: num(row.id),
    slug: str(row.slug),
    name: str(row.name),
    color: str(row.color),
    icon: str(row.icon),
    kind: str(row.kind) as CategoryKind,
  }));
}

export async function findCategory(id: number): Promise<Category | null> {
  const db = await getDb();
  const row = await db.get("SELECT * FROM categories WHERE id = ?", id);
  if (!row) return null;
  return {
    id: num(row.id),
    slug: str(row.slug),
    name: str(row.name),
    color: str(row.color),
    icon: str(row.icon),
    kind: str(row.kind) as CategoryKind,
  };
}

export interface EventFilter {
  status?: Status | "all";
  category?: string;
  query?: string;
  from?: string;
  limit?: number;
}

export async function listEvents(filter: EventFilter = {}): Promise<EventItem[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter.status && filter.status !== "all") {
    clauses.push("e.status = ?");
    params.push(filter.status);
  }
  if (filter.category) {
    clauses.push("c.slug = ?");
    params.push(filter.category);
  }
  if (filter.query) {
    clauses.push("(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)");
    const like = `%${filter.query}%`;
    params.push(like, like, like);
  }
  if (filter.from) {
    clauses.push("e.starts_at >= ?");
    params.push(filter.from);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = filter.limit ? `LIMIT ${Math.max(1, Math.floor(filter.limit))}` : "";
  const sql = `${EVENT_SELECT} ${where} ORDER BY e.starts_at ASC ${limit}`;
  const rows = await db.all(sql, ...params);
  return rows.map(mapEvent);
}

export async function getEventById(id: number): Promise<EventItem | null> {
  const db = await getDb();
  const row = await db.get(`${EVENT_SELECT} WHERE e.id = ?`, id);
  return row ? mapEvent(row) : null;
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  const db = await getDb();
  const row = await db.get(`${EVENT_SELECT} WHERE e.slug = ?`, slug);
  return row ? mapEvent(row) : null;
}

export interface EventWrite {
  slug: string;
  title: string;
  description: string;
  categoryId: number;
  lat: number;
  lng: number;
  venue: string;
  address: string;
  startsAt: string;
  endsAt: string | null;
  organizer: string;
  isFree: boolean;
  price: string | null;
  capacity: number | null;
  registered: number;
  status: Status;
}

export async function createEvent(data: EventWrite): Promise<EventItem> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO events
      (slug, title, description, category_id, lat, lng, venue, address, starts_at, ends_at,
       organizer, is_free, price, capacity, registered, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data.slug,
    data.title,
    data.description,
    data.categoryId,
    data.lat,
    data.lng,
    data.venue,
    data.address,
    data.startsAt,
    data.endsAt,
    data.organizer,
    data.isFree ? 1 : 0,
    data.price,
    data.capacity,
    data.registered,
    data.status,
    now,
    now,
  );
  return (await getEventById(Number(result.lastInsertRowid)))!;
}

export async function updateEvent(id: number, data: EventWrite): Promise<EventItem | null> {
  const db = await getDb();
  await db.run(
    `UPDATE events SET
      slug = ?, title = ?, description = ?, category_id = ?, lat = ?, lng = ?, venue = ?,
      address = ?, starts_at = ?, ends_at = ?, organizer = ?, is_free = ?, price = ?,
      capacity = ?, registered = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    data.slug,
    data.title,
    data.description,
    data.categoryId,
    data.lat,
    data.lng,
    data.venue,
    data.address,
    data.startsAt,
    data.endsAt,
    data.organizer,
    data.isFree ? 1 : 0,
    data.price,
    data.capacity,
    data.registered,
    data.status,
    new Date().toISOString(),
    id,
  );
  return getEventById(id);
}

export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run("DELETE FROM events WHERE id = ?", id);
  return result.changes > 0;
}

export interface PlaceFilter {
  status?: Status | "all";
  category?: string;
  query?: string;
}

export async function listPlaces(filter: PlaceFilter = {}): Promise<PlaceItem[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter.status && filter.status !== "all") {
    clauses.push("p.status = ?");
    params.push(filter.status);
  }
  if (filter.category) {
    clauses.push("c.slug = ?");
    params.push(filter.category);
  }
  if (filter.query) {
    clauses.push("(p.name LIKE ? OR p.description LIKE ? OR p.address LIKE ?)");
    const like = `%${filter.query}%`;
    params.push(like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await db.all(`${PLACE_SELECT} ${where} ORDER BY c.sort, p.name ASC`, ...params);
  return rows.map(mapPlace);
}

export async function getPlaceById(id: number): Promise<PlaceItem | null> {
  const db = await getDb();
  const row = await db.get(`${PLACE_SELECT} WHERE p.id = ?`, id);
  return row ? mapPlace(row) : null;
}

export async function getPlaceBySlug(slug: string): Promise<PlaceItem | null> {
  const db = await getDb();
  const row = await db.get(`${PLACE_SELECT} WHERE p.slug = ?`, slug);
  return row ? mapPlace(row) : null;
}

export interface PlaceWrite {
  slug: string;
  name: string;
  description: string;
  categoryId: number;
  lat: number;
  lng: number;
  address: string;
  workingHours: string | null;
  phone: string | null;
  url: string | null;
  status: Status;
}

export async function createPlace(data: PlaceWrite): Promise<PlaceItem> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO places
      (slug, name, description, category_id, lat, lng, address, working_hours, phone, url,
       status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data.slug,
    data.name,
    data.description,
    data.categoryId,
    data.lat,
    data.lng,
    data.address,
    data.workingHours,
    data.phone,
    data.url,
    data.status,
    now,
    now,
  );
  return (await getPlaceById(Number(result.lastInsertRowid)))!;
}

export async function updatePlace(id: number, data: PlaceWrite): Promise<PlaceItem | null> {
  const db = await getDb();
  await db.run(
    `UPDATE places SET
      slug = ?, name = ?, description = ?, category_id = ?, lat = ?, lng = ?, address = ?,
      working_hours = ?, phone = ?, url = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    data.slug,
    data.name,
    data.description,
    data.categoryId,
    data.lat,
    data.lng,
    data.address,
    data.workingHours,
    data.phone,
    data.url,
    data.status,
    new Date().toISOString(),
    id,
  );
  return getPlaceById(id);
}

export async function deletePlace(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run("DELETE FROM places WHERE id = ?", id);
  return result.changes > 0;
}

export async function getStats(): Promise<Stats> {
  const db = await getDb();
  const now = new Date().toISOString();
  const events = await db.get(
    `SELECT COUNT(*) AS c,
            COALESCE(SUM(registered), 0) AS r,
            COALESCE(SUM(CASE WHEN is_free = 1 THEN 1 ELSE 0 END), 0) AS f
     FROM events WHERE status = 'published' AND starts_at >= ?`,
    now,
  );
  const places = await db.get(
    "SELECT COUNT(*) AS c FROM places WHERE status = 'published'",
  );
  return {
    upcomingEvents: num(events?.c),
    registered: num(events?.r),
    freeEvents: num(events?.f),
    places: num(places?.c),
  };
}

export type RegisterResult =
  | { ok: true; registered: number; capacity: number | null }
  | { ok: false; code: "not_found" | "full" | "duplicate"; message: string };

export async function registerForEvent(
  eventId: number,
  name: string,
  phone: string,
): Promise<RegisterResult> {
  const db = await getDb();
  const event = await db.get(
    "SELECT id, capacity, registered, status FROM events WHERE id = ?",
    eventId,
  );
  if (!event || event.status !== "published") {
    return { ok: false, code: "not_found", message: "Tadbir topilmadi yoki faol emas" };
  }
  const capacity = event.capacity == null ? null : num(event.capacity);
  if (capacity != null && num(event.registered) >= capacity) {
    return { ok: false, code: "full", message: "Afsus, joylar allaqachon tugagan" };
  }
  const existing = await db.get(
    "SELECT id FROM registrations WHERE event_id = ? AND phone = ?",
    eventId,
    phone,
  );
  if (existing) {
    return {
      ok: false,
      code: "duplicate",
      message: "Bu telefon raqam bilan allaqachon ro'yxatdan o'tgansiz",
    };
  }
  await db.run(
    "INSERT INTO registrations (event_id, name, phone, created_at) VALUES (?, ?, ?, ?)",
    eventId,
    name,
    phone,
    new Date().toISOString(),
  );
  await db.run("UPDATE events SET registered = registered + 1, updated_at = ? WHERE id = ?", new Date().toISOString(), eventId);
  const updated = await db.get("SELECT registered FROM events WHERE id = ?", eventId);
  return { ok: true, registered: num(updated?.registered), capacity: capacity ?? null };
}

export async function listRegistrations(eventId: number): Promise<Registration[]> {
  const db = await getDb();
  const rows = await db.all(
    "SELECT id, event_id, name, phone, created_at FROM registrations WHERE event_id = ? ORDER BY created_at DESC",
    eventId,
  );
  return rows.map((row) => ({
    id: num(row.id),
    eventId: num(row.event_id),
    name: str(row.name),
    phone: str(row.phone),
    createdAt: str(row.created_at),
  }));
}

export interface AdminRecord extends AdminUser {
  passwordHash: string;
}

export async function findAdminByEmail(email: string): Promise<AdminRecord | null> {
  const db = await getDb();
  const row = await db.get(
    "SELECT id, email, password_hash, name FROM admins WHERE email = ?",
    email.toLowerCase(),
  );
  if (!row) return null;
  return {
    id: num(row.id),
    email: str(row.email),
    name: str(row.name),
    passwordHash: str(row.password_hash),
  };
}

export async function getAdminById(id: number): Promise<AdminUser | null> {
  const db = await getDb();
  const row = await db.get("SELECT id, email, name FROM admins WHERE id = ?", id);
  if (!row) return null;
  return { id: num(row.id), email: str(row.email), name: str(row.name) };
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .split("")
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[ʻʼ‘’`']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "yozuv";
}

export async function uniqueSlug(
  table: "events" | "places",
  base: string,
  excludeId?: number,
): Promise<string> {
  const db = await getDb();
  const root = slugify(base);
  const exists = async (slug: string) => {
    const row = excludeId
      ? await db.get(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, slug, excludeId)
      : await db.get(`SELECT id FROM ${table} WHERE slug = ?`, slug);
    return Boolean(row);
  };
  let candidate = root;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix++}`;
    if (suffix > 500) {
      candidate = `${root}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}
