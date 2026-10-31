import { getDb, type QueryRow } from "./db";
import { hashPassword, verifyPassword } from "./password";
import type { UserAccount } from "./types";

const num = (value: unknown, fallback = 0) => Number(value ?? fallback);
const str = (value: unknown, fallback = "") => (value == null ? fallback : String(value));

function mapUser(row: QueryRow): UserAccount {
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

export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  const db = await getDb();
  const row = await db.get(
    "SELECT id, name, phone, password_hash, created_at FROM users WHERE phone = ?",
    phone,
  );
  if (!row) return null;
  return { ...mapUser(row), passwordHash: str(row.password_hash) };
}

export async function getUserById(id: number): Promise<UserAccount | null> {
  const db = await getDb();
  const row = await db.get("SELECT id, name, phone, created_at FROM users WHERE id = ?", id);
  return row ? mapUser(row) : null;
}

export type CreateUserResult =
  | { ok: true; user: UserAccount }
  | { ok: false; code: "duplicate"; message: string };

export async function createUser(
  name: string,
  phone: string,
  password: string,
): Promise<CreateUserResult> {
  const db = await getDb();
  try {
    const result = await db.run(
      "INSERT INTO users (name, phone, password_hash, created_at) VALUES (?, ?, ?, ?)",
      name,
      phone,
      hashPassword(password),
      new Date().toISOString(),
    );
    const user = await getUserById(Number(result.lastInsertRowid));
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

export async function authenticateUser(
  phone: string,
  password: string,
): Promise<UserAccount | null> {
  const record = await findUserByPhone(phone);
  if (!record || !verifyPassword(password, record.passwordHash)) return null;
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    createdAt: record.createdAt,
  };
}

export async function countUserRegistrations(phone: string): Promise<number> {
  const db = await getDb();
  const row = await db.get("SELECT COUNT(*) AS c FROM registrations WHERE phone = ?", phone);
  return num(row?.c);
}
