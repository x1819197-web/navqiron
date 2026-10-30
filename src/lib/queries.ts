import { getDb } from "./db";
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

type Row = Record<string, unknown>;

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

export function listCategories(kind?: CategoryKind): Category[] {
  const db = getDb();
  const rows = kind
    ? (db.prepare("SELECT * FROM categories WHERE kind = ? ORDER BY sort, id").all(kind) as Row[])
    : (db.prepare("SELECT * FROM categories ORDER BY kind, sort, id").all() as Row[]);
  return rows.map((row) => ({
    id: num(row.id),
    slug: str(row.slug),
    name: str(row.name),
    color: str(row.color),
    icon: str(row.icon),
    kind: str(row.kind) as CategoryKind,
  }));
}

export function findCategory(id: number): Category | null {
  const row = getDb().prepare("SELECT * FROM categories WHERE id = ?").get(id) as Row | undefined;
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

export function listEvents(filter: EventFilter = {}): EventItem[] {
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
  const rows = getDb().prepare(sql).all(...params) as Row[];
  return rows.map(mapEvent);
}

export function getEventById(id: number): EventItem | null {
  const row = getDb().prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(id) as Row | undefined;
  return row ? mapEvent(row) : null;
}

export function getEventBySlug(slug: string): EventItem | null {
  const row = getDb().prepare(`${EVENT_SELECT} WHERE e.slug = ?`).get(slug) as Row | undefined;
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

export function createEvent(data: EventWrite): EventItem {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO events
        (slug, title, description, category_id, lat, lng, venue, address, starts_at, ends_at,
         organizer, is_free, price, capacity, registered, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
  return getEventById(Number(result.lastInsertRowid))!;
}

export function updateEvent(id: number, data: EventWrite): EventItem | null {
  const db = getDb();
  db.prepare(
    `UPDATE events SET
      slug = ?, title = ?, description = ?, category_id = ?, lat = ?, lng = ?, venue = ?,
      address = ?, starts_at = ?, ends_at = ?, organizer = ?, is_free = ?, price = ?,
      capacity = ?, registered = ?, status = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
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

export function deleteEvent(id: number): boolean {
  const result = getDb().prepare("DELETE FROM events WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

export interface PlaceFilter {
  status?: Status | "all";
  category?: string;
  query?: string;
}

export function listPlaces(filter: PlaceFilter = {}): PlaceItem[] {
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
  const rows = getDb()
    .prepare(`${PLACE_SELECT} ${where} ORDER BY c.sort, p.name ASC`)
    .all(...params) as Row[];
  return rows.map(mapPlace);
}

export function getPlaceById(id: number): PlaceItem | null {
  const row = getDb().prepare(`${PLACE_SELECT} WHERE p.id = ?`).get(id) as Row | undefined;
  return row ? mapPlace(row) : null;
}

export function getPlaceBySlug(slug: string): PlaceItem | null {
  const row = getDb().prepare(`${PLACE_SELECT} WHERE p.slug = ?`).get(slug) as Row | undefined;
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

export function createPlace(data: PlaceWrite): PlaceItem {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO places
        (slug, name, description, category_id, lat, lng, address, working_hours, phone, url,
         status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
  return getPlaceById(Number(result.lastInsertRowid))!;
}

export function updatePlace(id: number, data: PlaceWrite): PlaceItem | null {
  getDb()
    .prepare(
      `UPDATE places SET
        slug = ?, name = ?, description = ?, category_id = ?, lat = ?, lng = ?, address = ?,
        working_hours = ?, phone = ?, url = ?, status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
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

export function deletePlace(id: number): boolean {
  const result = getDb().prepare("DELETE FROM places WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

export function getStats(): Stats {
  const db = getDb();
  const now = new Date().toISOString();
  const events = db
    .prepare(
      `SELECT COUNT(*) AS c,
              COALESCE(SUM(registered), 0) AS r,
              COALESCE(SUM(CASE WHEN is_free = 1 THEN 1 ELSE 0 END), 0) AS f
       FROM events WHERE status = 'published' AND starts_at >= ?`,
    )
    .get(now) as Row;
  const places = db
    .prepare("SELECT COUNT(*) AS c FROM places WHERE status = 'published'")
    .get() as Row;
  return {
    upcomingEvents: num(events.c),
    registered: num(events.r),
    freeEvents: num(events.f),
    places: num(places.c),
  };
}

export type RegisterResult =
  | { ok: true; registered: number; capacity: number | null }
  | { ok: false; code: "not_found" | "full" | "duplicate"; message: string };

export function registerForEvent(
  eventId: number,
  name: string,
  phone: string,
): RegisterResult {
  const db = getDb();
  const event = db
    .prepare("SELECT id, capacity, registered, status FROM events WHERE id = ?")
    .get(eventId) as Row | undefined;
  if (!event || event.status !== "published") {
    return { ok: false, code: "not_found", message: "Tadbir topilmadi yoki faol emas" };
  }
  const capacity = event.capacity == null ? null : num(event.capacity);
  if (capacity != null && num(event.registered) >= capacity) {
    return { ok: false, code: "full", message: "Afsus, joylar allaqachon tugagan" };
  }
  try {
    db.prepare(
      "INSERT INTO registrations (event_id, name, phone, created_at) VALUES (?, ?, ?, ?)",
    ).run(eventId, name, phone, new Date().toISOString());
  } catch (error) {
    if (String(error).toUpperCase().includes("UNIQUE")) {
      return {
        ok: false,
        code: "duplicate",
        message: "Bu telefon raqam bilan allaqachon ro'yxatdan o'tgansiz",
      };
    }
    throw error;
  }
  db.prepare("UPDATE events SET registered = registered + 1, updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    eventId,
  );
  const updated = db.prepare("SELECT registered FROM events WHERE id = ?").get(eventId) as Row;
  return { ok: true, registered: num(updated.registered), capacity: capacity ?? null };
}

export function listRegistrations(eventId: number): Registration[] {
  const rows = getDb()
    .prepare(
      "SELECT id, event_id, name, phone, created_at FROM registrations WHERE event_id = ? ORDER BY created_at DESC",
    )
    .all(eventId) as Row[];
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

export function findAdminByEmail(email: string): AdminRecord | null {
  const row = getDb()
    .prepare("SELECT id, email, password_hash, name FROM admins WHERE email = ?")
    .get(email.toLowerCase()) as Row | undefined;
  if (!row) return null;
  return {
    id: num(row.id),
    email: str(row.email),
    name: str(row.name),
    passwordHash: str(row.password_hash),
  };
}

export function getAdminById(id: number): AdminUser | null {
  const row = getDb()
    .prepare("SELECT id, email, name FROM admins WHERE id = ?")
    .get(id) as Row | undefined;
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

export function uniqueSlug(table: "events" | "places", base: string, excludeId?: number): string {
  const db = getDb();
  const root = slugify(base);
  const check = excludeId
    ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`)
    : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`);
  const exists = (slug: string) =>
    excludeId ? check.get(slug, excludeId) : check.get(slug);
  let candidate = root;
  let suffix = 2;
  while (exists(candidate)) {
    candidate = `${root}-${suffix++}`;
    if (suffix > 500) {
      candidate = `${root}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}
