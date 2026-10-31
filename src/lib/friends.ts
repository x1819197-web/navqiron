import { getDb, type QueryRow } from "./db";
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

type Row = QueryRow;

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

export async function listFriends(viewerId: number): Promise<FriendSummary[]> {
  const db = await getDb();
  const rows = await db.all(`${FRIEND_JOIN} ORDER BY u.name COLLATE NOCASE`, viewerId, viewerId, viewerId);
  return rows.map((row) => friendFrom(row));
}

export async function countFriends(viewerId: number): Promise<number> {
  const db = await getDb();
  const row = await db.get(
    `SELECT COUNT(*) AS c FROM friendships
     WHERE state = 'accepted' AND (requester_id = ? OR addressee_id = ?)`,
    viewerId,
    viewerId,
  );
  return num(row?.c);
}

async function requestRows(
  viewerId: number,
  direction: "in" | "out",
): Promise<FriendRequestItem[]> {
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
  const db = await getDb();
  const rows = await db.all(sql, viewerId);
  return rows.map((row) => ({
    id: num(row.request_id),
    user: friendFrom(row, "request_created"),
    createdAt: str(row.request_created),
  }));
}

export async function findRelationship(
  viewerId: number,
  targetId: number,
): Promise<{
  id: number;
  requesterId: number;
  addresseeId: number;
  state: "requested" | "accepted" | "blocked";
} | null> {
  const db = await getDb();
  const row = await db.get(
    `SELECT id, requester_id, addressee_id, state FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?)
        OR (requester_id = ? AND addressee_id = ?)
     ORDER BY id DESC LIMIT 1`,
    viewerId,
    targetId,
    targetId,
    viewerId,
  );
  if (!row) return null;
  return {
    id: num(row.id),
    requesterId: num(row.requester_id),
    addresseeId: num(row.addressee_id),
    state: str(row.state, "requested") as "requested" | "accepted" | "blocked",
  };
}

export async function areFriends(a: number, b: number): Promise<boolean> {
  const rel = await findRelationship(a, b);
  return rel?.state === "accepted";
}

export async function relationFor(viewerId: number, targetId: number): Promise<Relation> {
  if (viewerId === targetId) return "self";
  const rel = await findRelationship(viewerId, targetId);
  if (!rel) return "none";
  if (rel.state === "accepted") return "friends";
  if (rel.state === "blocked") return "blocked";
  return rel.requesterId === viewerId ? "outgoing" : "incoming";
}

export async function searchUsers(viewerId: number, query: string): Promise<PublicUser[]> {
  const text = query.trim();
  if (text.length < 2) return [];
  const digits = text.replace(/\D/g, "");
  const db = await getDb();
  const rows =
    digits.length >= 4
      ? await db.all(
          `SELECT id, name, phone, free_until, free_note FROM users
           WHERE id != ? AND phone LIKE ? ORDER BY name COLLATE NOCASE LIMIT 8`,
          viewerId,
          `%${digits}%`,
        )
      : await db.all(
          `SELECT id, name, phone, free_until, free_note FROM users
           WHERE id != ? AND name LIKE ? ORDER BY name COLLATE NOCASE LIMIT 8`,
          viewerId,
          `%${text}%`,
        );

  const users = await Promise.all(rows.map((row) => publicFromRow(viewerId, row)));
  return users.filter((user) => user.relation !== "blocked");
}

async function publicFromRow(viewerId: number, row: Row): Promise<PublicUser> {
  const relation = await relationFor(viewerId, num(row.id));
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

export async function getPublicUser(viewerId: number, targetId: number): Promise<PublicUser | null> {
  const db = await getDb();
  const row = await db.get(
    "SELECT id, name, phone, free_until, free_note FROM users WHERE id = ?",
    targetId,
  );
  return row ? publicFromRow(viewerId, row) : null;
}

export type FriendActionResult =
  | { ok: true; relation: Relation }
  | { ok: false; code: "self" | "blocked" | "not_found"; message: string };

export async function sendFriendRequest(
  viewerId: number,
  targetId: number,
): Promise<FriendActionResult> {
  if (viewerId === targetId) {
    return { ok: false, code: "self", message: "O'zingizga so'rov yubora olmaysiz" };
  }
  const db = await getDb();
  const target = await db.get("SELECT id, name FROM users WHERE id = ?", targetId);
  if (!target) {
    return { ok: false, code: "not_found", message: "Foydalanuvchi topilmadi" };
  }

  const rel = await findRelationship(viewerId, targetId);
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
    await db.run(
      "UPDATE friendships SET state = 'accepted', responded_at = ? WHERE id = ?",
      new Date().toISOString(),
      rel.id,
    );
    await createNotification(
      targetId,
      "friend_accept",
      `${await viewerName(viewerId)} do'stlik so'rovingizni qabul qildi`,
      "Endi bir-biringizni xaritada ko'rishingiz mumkin",
      null,
      viewerId,
    );
    return { ok: true, relation: "friends" };
  }

  await db.run(
    "INSERT INTO friendships (requester_id, addressee_id, state, created_at) VALUES (?, ?, 'requested', ?)",
    viewerId,
    targetId,
    new Date().toISOString(),
  );
  await createNotification(
    targetId,
    "friend_request",
    `${await viewerName(viewerId)} do'st bo'lishni taklif qildi`,
    "So'rovni qabul qilib, bir-biringizni xaritada ko'ring",
    null,
    viewerId,
  );
  return { ok: true, relation: "outgoing" };
}

export async function respondToRequest(
  viewerId: number,
  requestId: number,
  accept: boolean,
): Promise<boolean> {
  const db = await getDb();
  const row = await db.get(
    "SELECT id, requester_id, state FROM friendships WHERE id = ? AND addressee_id = ?",
    requestId,
    viewerId,
  );
  if (!row || row.state !== "requested") return false;
  if (accept) {
    await db.run(
      "UPDATE friendships SET state = 'accepted', responded_at = ? WHERE id = ?",
      new Date().toISOString(),
      requestId,
    );
    await createNotification(
      num(row.requester_id),
      "friend_accept",
      `${await viewerName(viewerId)} do'stlik so'rovingizni qabul qildi`,
      "Endi bir-biringizni xaritada ko'rishingiz mumkin",
      null,
      viewerId,
    );
  } else {
    await db.run("DELETE FROM friendships WHERE id = ?", requestId);
  }
  return true;
}

export async function removeFriend(viewerId: number, friendId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run(
    `DELETE FROM friendships
     WHERE state = 'accepted'
       AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    viewerId,
    friendId,
    friendId,
    viewerId,
  );
  return result.changes > 0;
}

export async function blockUser(viewerId: number, targetId: number): Promise<boolean> {
  if (viewerId === targetId) return false;
  const db = await getDb();
  await db.run(
    `DELETE FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    viewerId,
    targetId,
    targetId,
    viewerId,
  );
  await db.run(
    "INSERT INTO friendships (requester_id, addressee_id, state, created_at) VALUES (?, ?, 'blocked', ?)",
    viewerId,
    targetId,
    new Date().toISOString(),
  );
  return true;
}

export async function unblockUser(viewerId: number, targetId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run(
    "DELETE FROM friendships WHERE requester_id = ? AND addressee_id = ? AND state = 'blocked'",
    viewerId,
    targetId,
  );
  return result.changes > 0;
}

async function viewerName(userId: number): Promise<string> {
  const db = await getDb();
  const row = await db.get("SELECT name FROM users WHERE id = ?", userId);
  return str(row?.name, "Foydalanuvchi");
}

export async function getFreeStatus(userId: number): Promise<FreeStatus | null> {
  const db = await getDb();
  const row = await db.get(
    "SELECT free_until, free_note, free_lat, free_lng FROM users WHERE id = ?",
    userId,
  );
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

export async function setFreeStatus(
  userId: number,
  hours: number,
  note: string,
  lat: number | null,
  lng: number | null,
): Promise<FreeStatus> {
  const db = await getDb();
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await db.run(
    "UPDATE users SET free_until = ?, free_note = ?, free_lat = ?, free_lng = ? WHERE id = ?",
    until,
    note,
    lat,
    lng,
    userId,
  );
  return { until, note, lat, lng };
}

export async function clearFreeStatus(userId: number): Promise<void> {
  const db = await getDb();
  await db.run(
    "UPDATE users SET free_until = NULL, free_note = NULL, free_lat = NULL, free_lng = NULL WHERE id = ?",
    userId,
  );
}

export async function listFreeFriends(viewerId: number): Promise<FreeFriend[]> {
  const db = await getDb();
  const rows = await db.all(
    `SELECT u.id, u.name, u.free_until, u.free_note, u.free_lat, u.free_lng
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
     WHERE f.state = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
       AND u.free_until > ? AND u.free_lat IS NOT NULL`,
    viewerId,
    viewerId,
    viewerId,
    new Date().toISOString(),
  );
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

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  eventId: number | null,
  fromUserId: number | null,
): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO notifications (user_id, type, title, body, event_id, from_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    userId,
    type,
    title,
    body,
    eventId,
    fromUserId,
    new Date().toISOString(),
  );
}

export async function listNotifications(
  userId: number,
  limit = 30,
): Promise<AppNotification[]> {
  const db = await getDb();
  const rows = await db.all(
    `SELECT id, type, title, body, event_id, created_at, read_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    userId,
    limit,
  );
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

export async function markNotificationsRead(userId: number, id?: number): Promise<void> {
  const db = await getDb();
  if (id != null) {
    await db.run(
      "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL",
      new Date().toISOString(),
      id,
      userId,
    );
    return;
  }
  await db.run(
    "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
    new Date().toISOString(),
    userId,
  );
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = await getDb();
  const row = await db.get(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL",
    userId,
  );
  return num(row?.c);
}

export type InviteResult = { ok: true } | { ok: false; message: string };

export async function inviteFriendToEvent(
  viewerId: number,
  friendId: number,
  eventId: number,
): Promise<InviteResult> {
  if (!(await areFriends(viewerId, friendId))) {
    return { ok: false, message: "Faqat do'stlaringizni taklif qilishingiz mumkin" };
  }
  const event = await getEventById(eventId);
  if (!event || event.status !== "published") {
    return { ok: false, message: "Tadbir topilmadi" };
  }
  await createNotification(
    friendId,
    "invite",
    `${await viewerName(viewerId)} sizni tadbirga taklif qildi`,
    event.title,
    eventId,
    viewerId,
  );
  return { ok: true };
}

export async function friendGoingCounts(viewerId: number): Promise<Record<number, number>> {
  const friends = await listFriends(viewerId);
  const phones = friends.map((friend) => friend.phone);
  if (!phones.length) return {};
  const placeholders = phones.map(() => "?").join(",");
  const db = await getDb();
  const rows = await db.all(
    `SELECT r.event_id AS eid, COUNT(DISTINCT r.phone) AS c
     FROM registrations r WHERE r.phone IN (${placeholders}) GROUP BY r.event_id`,
    ...phones,
  );
  const result: Record<number, number> = {};
  for (const row of rows) result[num(row.eid)] = num(row.c);
  return result;
}

export async function getFriendsOverview(viewerId: number): Promise<FriendsOverview> {
  const [friends, incoming, outgoing, free, freeStatus, notifications, unread] = await Promise.all([
    listFriends(viewerId),
    requestRows(viewerId, "in"),
    requestRows(viewerId, "out"),
    listFreeFriends(viewerId),
    getFreeStatus(viewerId),
    listNotifications(viewerId),
    countUnreadNotifications(viewerId),
  ]);
  return { friends, incoming, outgoing, free, freeStatus, notifications, unread };
}
