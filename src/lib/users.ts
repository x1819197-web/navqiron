import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import type { UserAccount } from "./types";

type Row = Record<string, unknown>;

const num = (value: unknown, fallback = 0) => Number(value ?? fallback);
const str = (value: unknown, fallback = "") => (value == null ? fallback : String(value));

function mapUser(row: Row): UserAccount {
  return {
    id: num(row.id),
    name: str(row.name),
    phone: str(row.phone),
    createdAt: str(row.created_at),
  };
}

export interface UserRecord extends UserAccount {
  passwordHash: string;
}

export function findUserByPhone(phone: string): UserRecord | null {
  const row = getDb()
    .prepare("SELECT id, name, phone, password_hash, created_at FROM users WHERE phone = ?")
    .get(phone) as Row | undefined;
  if (!row) return null;
  return { ...mapUser(row), passwordHash: str(row.password_hash) };
}

export function getUserById(id: number): UserAccount | null {
  const row = getDb()
    .prepare("SELECT id, name, phone, created_at FROM users WHERE id = ?")
    .get(id) as Row | undefined;
  return row ? mapUser(row) : null;
}

export type CreateUserResult =
  | { ok: true; user: UserAccount }
  | { ok: false; code: "duplicate"; message: string };

export function createUser(name: string, phone: string, password: string): CreateUserResult {
  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO users (name, phone, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(name, phone, hashPassword(password), new Date().toISOString());
    const user = getUserById(Number(result.lastInsertRowid));
    if (!user) throw new Error("Foydalanuvchi yaratilmadi");
    return { ok: true, user };
  } catch (error) {
    if (String(error).toUpperCase().includes("UNIQUE")) {
      return {
        ok: false,
        code: "duplicate",
        message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan",
      };
    }
    throw error;
  }
}

export function authenticateUser(phone: string, password: string): UserAccount | null {
  const record = findUserByPhone(phone);
  if (!record || !verifyPassword(password, record.passwordHash)) return null;
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    createdAt: record.createdAt,
  };
}

export function countUserRegistrations(phone: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM registrations WHERE phone = ?")
    .get(phone) as Row | undefined;
  return num(row?.c);
}
