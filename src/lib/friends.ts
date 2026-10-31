import { getDb } from "./db";
import { getEventById } from "./queries";
import type {
  AppNotification,
  FreeFriend,
  FreeStatus,
  FriendRequestItem,
  FriendSummary,
  FriendsOverview,
  PublicUser,
  Relation,
} from "./types";

type Row = Record<string, unknown>;

const num = (value: unknown, fallback = 0) => Number(value ?? fallback);
const str = (value: unknown, fallback = "") => (value == null ? fallback : String(value));
const nullableStr = (value: unknown) => (value == null || value === "" ? null : String(value));

// Grid ~250 m per the TZ privacy rule for "bo'shman" positions.
const GRID = 400;
const approx = (value: number) => Math.round(value * GRID) / GRID;

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function friendFrom(row: Row, sinceKey = "since"): FriendSummary {
  const name = str(row.name);
  return {
    id: num(row.id),
    name,
    phone: str(row.phone),
    initials: initialsOf(name),
    since: str(row[sinceKey]),
    freeUntil: nullableStr(row.free_until),
    freeNote: nullableStr(row.free_note),
  };
}

const FRIEND_JOIN = `
  SELECT u.id, u.name, u.phone, u.free_until, u.free_note, f.created_at AS since
  FROM friendships f
  JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
  WHERE f.state = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
`;

export function listFriends(viewerId: number): FriendSummary[] {
  const rows = getDb()
    .prepare(`${FRIEND_JOIN} ORDER BY u.name COLLATE NOCASE`)
    .all(viewerId, viewerId, viewerId) as Row[];
  return rows.map((row) => friendFrom(row));
}

export function countFriends(viewerId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c FROM friendships
       WHERE state = 'accepted' AND (requester_id = ? OR addressee_id = ?)`,
    )
    .get(viewerId, viewerId) as Row | undefined;
  return num(row?.c);
}

function requestRows(viewerId: number, direction: "in" | "out"): FriendRequestItem[] {
  const sql =
    direction === "in"
      ? `SELECT f.id AS request_id, f.created_at AS request_created,
                u.id, u.name, u.phone, u.free_until, u.free_note
         FROM friendships f JOIN users u ON u.id = f.requester_id
         WHERE f.addressee_id = ? AND f.state = 'requested'
         ORDER BY f.created_at DESC`
      : `SELECT f.id AS request_id, f.created_at AS request_created,
                u.id, u.name, u.phone, u.free_until, u.free_note
         FROM friendships f JOIN users u ON u.id = f.addressee_id
         WHERE f.requester_id = ? AND f.state = 'requested'
         ORDER BY f.created_at DESC`;
  const rows = getDb().prepare(sql).all(viewerId) as Row[];
  return rows.map((row) => ({
    id: num(row.request_id),
    user: friendFrom(row, "request_created"),
    createdAt: str(row.request_created),
  }));
}

export function findRelationship(viewerId: number, targetId: number): {
  id: number;
  requesterId: number;
  addresseeId: number;
  state: "requested" | "accepted" | "blocked";
} | null {
  const row = getDb()
    .prepare(
      `SELECT id, requester_id, addressee_id, state FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?)
          OR (requester_id = ? AND addressee_id = ?)
       ORDER BY id DESC LIMIT 1`,
    )
    .get(viewerId, targetId, targetId, viewerId) as Row | undefined;
  if (!row) return null;
  return {
    id: num(row.id),
    requesterId: num(row.requester_id),
    addresseeId: num(row.addressee_id),
    state: str(row.state, "requested") as "requested" | "accepted" | "blocked",
  };
}

export function areFriends(a: number, b: number): boolean {
  const rel = findRelationship(a, b);
  return rel?.state === "accepted";
}

export function relationFor(viewerId: number, targetId: number): Relation {
  if (viewerId === targetId) return "self";
  const rel = findRelationship(viewerId, targetId);
  if (!rel) return "none";
  if (rel.state === "accepted") return "friends";
  if (rel.state === "blocked") return "blocked";
  return rel.requesterId === viewerId ? "outgoing" : "incoming";
}

export function searchUsers(viewerId: number, query: string): PublicUser[] {
  const text = query.trim();
  if (text.length < 2) return [];
  const digits = text.replace(/\D/g, "");
  const db = getDb();
  const rows = (
    digits.length >= 4
      ? db
          .prepare(
            `SELECT id, name, phone, free_until, free_note FROM users
             WHERE id != ? AND phone LIKE ? ORDER BY name COLLATE NOCASE LIMIT 8`,
          )
          .all(viewerId, `%${digits}%`)
      : db
          .prepare(
            `SELECT id, name, phone, free_until, free_note FROM users
             WHERE id != ? AND name LIKE ? ORDER BY name COLLATE NOCASE LIMIT 8`,
          )
          .all(viewerId, `%${text}%`)
  ) as Row[];

  return rows
    .map((row) => publicFromRow(viewerId, row))
    .filter((user) => user.relation !== "blocked");
}

function publicFromRow(viewerId: number, row: Row): PublicUser {
  const relation = relationFor(viewerId, num(row.id));
  const name = str(row.name);
  return {
    id: num(row.id),
    name,
    initials: initialsOf(name),
    phone: relation === "friends" || relation === "self" ? str(row.phone) : null,
    relation,
    freeUntil: nullableStr(row.free_until),
    freeNote: nullableStr(row.free_note),
  };
}

export function getPublicUser(viewerId: number, targetId: number): PublicUser | null {
  const row = getDb()
    .prepare("SELECT id, name, phone, free_until, free_note FROM users WHERE id = ?")
    .get(targetId) as Row | undefined;
  return row ? publicFromRow(viewerId, row) : null;
}

export type FriendActionResult =
  | { ok: true; relation: Relation }
  | { ok: false; code: "self" | "blocked" | "not_found"; message: string };

export function sendFriendRequest(viewerId: number, targetId: number): FriendActionResult {
  if (viewerId === targetId) {
    return { ok: false, code: "self", message: "O'zingizga so'rov yubora olmaysiz" };
  }
  const target = getDb()
    .prepare("SELECT id, name FROM users WHERE id = ?")
    .get(targetId) as Row | undefined;
  if (!target) {
    return { ok: false, code: "not_found", message: "Foydalanuvchi topilmadi" };
  }

  const rel = findRelationship(viewerId, targetId);
  if (rel?.state === "blocked") {
    return { ok: false, code: "blocked", message: "Bu foydalanuvchiga so'rov yuborib bo'lmaydi" };
  }
  if (rel?.state === "accepted") {
    return { ok: true, relation: "friends" };
  }
  if (rel?.state === "requested") {
    if (rel.requesterId === viewerId) {
      return { ok: true, relation: "outgoing" };
    }
    const now = new Date().toISOString();
    getDb()
      .prepare("UPDATE friendships SET state = 'accepted', responded_at = ? WHERE id = ?")
      .run(now, rel.id);
    createNotification(
      targetId,
      "friend_accept",
      `${viewerName(viewerId)} do'stlik so'rovingizni qabul qildi`,
      "Endi bir-biringizni xaritada ko'rishingiz mumkin",
      null,
      viewerId,
    );
    return { ok: true, relation: "friends" };
  }

  getDb()
    .prepare(
      "INSERT INTO friendships (requester_id, addressee_id, state, created_at) VALUES (?, ?, 'requested', ?)",
    )
    .run(viewerId, targetId, new Date().toISOString());
  createNotification(
    targetId,
    "friend_request",
    `${viewerName(viewerId)} do'st bo'lishni taklif qildi`,
    "So'rovni qabul qilib, bir-biringizni xaritada ko'ring",
    null,
    viewerId,
  );
  return { ok: true, relation: "outgoing" };
}

export function respondToRequest(
  viewerId: number,
  requestId: number,
  accept: boolean,
): boolean {
  const row = getDb()
    .prepare("SELECT id, requester_id, state FROM friendships WHERE id = ? AND addressee_id = ?")
    .get(requestId, viewerId) as Row | undefined;
  if (!row || row.state !== "requested") return false;
  if (accept) {
    getDb()
      .prepare("UPDATE friendships SET state = 'accepted', responded_at = ? WHERE id = ?")
      .run(new Date().toISOString(), requestId);
    createNotification(
      num(row.requester_id),
      "friend_accept",
      `${viewerName(viewerId)} do'stlik so'rovingizni qabul qildi`,
      "Endi bir-biringizni xaritada ko'rishingiz mumkin",
      null,
      viewerId,
    );
  } else {
    getDb().prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
  }
  return true;
}

export function removeFriend(viewerId: number, friendId: number): boolean {
  const result = getDb()
    .prepare(
      `DELETE FROM friendships
       WHERE state = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    )
    .run(viewerId, friendId, friendId, viewerId);
  return Number(result.changes) > 0;
}

export function blockUser(viewerId: number, targetId: number): boolean {
  if (viewerId === targetId) return false;
  const db = getDb();
  db.prepare(
    `DELETE FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
  ).run(viewerId, targetId, targetId, viewerId);
  db.prepare(
    "INSERT INTO friendships (requester_id, addressee_id, state, created_at) VALUES (?, ?, 'blocked', ?)",
  ).run(viewerId, targetId, new Date().toISOString());
  return true;
}

export function unblockUser(viewerId: number, targetId: number): boolean {
  const result = getDb()
    .prepare(
      "DELETE FROM friendships WHERE requester_id = ? AND addressee_id = ? AND state = 'blocked'",
    )
    .run(viewerId, targetId);
  return Number(result.changes) > 0;
}

function viewerName(userId: number): string {
  const row = getDb()
    .prepare("SELECT name FROM users WHERE id = ?")
    .get(userId) as Row | undefined;
  return str(row?.name, "Foydalanuvchi");
}

export function getFreeStatus(userId: number): FreeStatus | null {
  const row = getDb()
    .prepare("SELECT free_until, free_note, free_lat, free_lng FROM users WHERE id = ?")
    .get(userId) as Row | undefined;
  if (!row) return null;
  const until = nullableStr(row.free_until);
  if (!until || new Date(until).getTime() < Date.now()) return null;
  return {
    until,
    note: str(row.free_note),
    lat: row.free_lat == null ? null : num(row.free_lat),
    lng: row.free_lng == null ? null : num(row.free_lng),
  };
}

export function setFreeStatus(
  userId: number,
  hours: number,
  note: string,
  lat: number | null,
  lng: number | null,
): FreeStatus {
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  getDb()
    .prepare("UPDATE users SET free_until = ?, free_note = ?, free_lat = ?, free_lng = ? WHERE id = ?")
    .run(until, note, lat, lng, userId);
  return { until, note, lat, lng };
}

export function clearFreeStatus(userId: number): void {
  getDb()
    .prepare("UPDATE users SET free_until = NULL, free_note = NULL, free_lat = NULL, free_lng = NULL WHERE id = ?")
    .run(userId);
}

export function listFreeFriends(viewerId: number): FreeFriend[] {
  const rows = getDb()
    .prepare(
      `SELECT u.id, u.name, u.free_until, u.free_note, u.free_lat, u.free_lng
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
       WHERE f.state = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
         AND u.free_until > ? AND u.free_lat IS NOT NULL`,
    )
    .all(viewerId, viewerId, viewerId, new Date().toISOString()) as Row[];
  return rows.map((row) => ({
    id: num(row.id),
    name: str(row.name),
    initials: initialsOf(str(row.name)),
    lat: approx(num(row.free_lat)),
    lng: approx(num(row.free_lng)),
    note: str(row.free_note),
    until: str(row.free_until),
  }));
}

export function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  eventId: number | null,
  fromUserId: number | null,
): void {
  getDb()
    .prepare(
      `INSERT INTO notifications (user_id, type, title, body, event_id, from_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, type, title, body, eventId, fromUserId, new Date().toISOString());
}

export function listNotifications(userId: number, limit = 30): AppNotification[] {
  const rows = getDb()
    .prepare(
      `SELECT id, type, title, body, event_id, created_at, read_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, limit) as Row[];
  return rows.map((row) => ({
    id: num(row.id),
    type: str(row.type),
    title: str(row.title),
    body: str(row.body),
    eventId: row.event_id == null ? null : num(row.event_id),
    createdAt: str(row.created_at),
    readAt: nullableStr(row.read_at),
  }));
}

export function markNotificationsRead(userId: number, id?: number): void {
  const db = getDb();
  if (id != null) {
    db.prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL").run(
      new Date().toISOString(),
      id,
      userId,
    );
    return;
  }
  db.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").run(
    new Date().toISOString(),
    userId,
  );
}

export function countUnreadNotifications(userId: number): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL")
    .get(userId) as Row | undefined;
  return num(row?.c);
}

export type InviteResult = { ok: true } | { ok: false; message: string };

export function inviteFriendToEvent(
  viewerId: number,
  friendId: number,
  eventId: number,
): InviteResult {
  if (!areFriends(viewerId, friendId)) {
    return { ok: false, message: "Faqat do'stlaringizni taklif qilishingiz mumkin" };
  }
  const event = getEventById(eventId);
  if (!event || event.status !== "published") {
    return { ok: false, message: "Tadbir topilmadi" };
  }
  createNotification(
    friendId,
    "invite",
    `${viewerName(viewerId)} sizni tadbirga taklif qildi`,
    event.title,
    eventId,
    viewerId,
  );
  return { ok: true };
}

export function friendGoingCounts(viewerId: number): Record<number, number> {
  const phones = listFriends(viewerId).map((friend) => friend.phone);
  if (!phones.length) return {};
  const placeholders = phones.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT r.event_id AS eid, COUNT(DISTINCT r.phone) AS c
       FROM registrations r WHERE r.phone IN (${placeholders}) GROUP BY r.event_id`,
    )
    .all(...phones) as Row[];
  const result: Record<number, number> = {};
  for (const row of rows) result[num(row.eid)] = num(row.c);
  return result;
}

export function getFriendsOverview(viewerId: number): FriendsOverview {
  return {
    friends: listFriends(viewerId),
    incoming: requestRows(viewerId, "in"),
    outgoing: requestRows(viewerId, "out"),
    free: listFreeFriends(viewerId),
    freeStatus: getFreeStatus(viewerId),
    notifications: listNotifications(viewerId),
    unread: countUnreadNotifications(viewerId),
  };
}
