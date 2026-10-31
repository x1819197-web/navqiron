import fs from "node:fs";
import path from "node:path";
import { createClient, type Client, type InValue } from "@libsql/client";
import { seedDatabase } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Administrator',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('event', 'place')),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id INTEGER NOT NULL REFERENCES categories(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  venue TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  organizer TEXT NOT NULL DEFAULT '',
  is_free INTEGER NOT NULL DEFAULT 1,
  price TEXT,
  capacity INTEGER,
  registered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id INTEGER NOT NULL REFERENCES categories(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  working_hours TEXT,
  phone TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (event_id, phone)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'requested' CHECK (state IN ('requested', 'accepted', 'blocked')),
  created_at TEXT NOT NULL,
  responded_at TEXT,
  UNIQUE (requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  event_id INTEGER,
  from_user_id INTEGER,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status_starts ON events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_friendships_pair ON friendships(requester_id, addressee_id, state);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
`;

export type QueryRow = Record<string, unknown>;
export type RunResult = { changes: number; lastInsertRowid: number };

export interface Database {
  get(sql: string, ...args: InValue[]): Promise<QueryRow | undefined>;
  all(sql: string, ...args: InValue[]): Promise<QueryRow[]>;
  run(sql: string, ...args: InValue[]): Promise<RunResult>;
  exec(sql: string): Promise<void>;
  batch(statements: string[]): Promise<void>;
}

function createClientInstance(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "navqiron.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: `file:${file.replace(/\\/g, "/")}` });
}

async function ensureColumn(client: Client, table: string, column: string, definition: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  if (result.rows.some((row) => String(row.name) === column)) return;
  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function wrap(client: Client): Database {
  return {
    async get(sql, ...args) {
      const result = await client.execute({ sql, args });
      return result.rows[0] as QueryRow | undefined;
    },
    async all(sql, ...args) {
      const result = await client.execute({ sql, args });
      return result.rows.map((row) => ({ ...row })) as QueryRow[];
    },
    async run(sql, ...args) {
      const result = await client.execute({ sql, args });
      return {
        changes: Number(result.rowsAffected ?? 0),
        lastInsertRowid: Number(result.lastInsertRowid ?? 0),
      };
    },
    async exec(sql) {
      await client.executeMultiple(sql);
    },
    async batch(statements) {
      if (!statements.length) return;
      await client.batch(statements, "write");
    },
  };
}

async function prepareDatabase(): Promise<Database> {
  const client = createClientInstance();
  await client.executeMultiple(SCHEMA);
  await ensureColumn(client, "users", "free_until", "TEXT");
  await ensureColumn(client, "users", "free_note", "TEXT");
  await ensureColumn(client, "users", "free_lat", "REAL");
  await ensureColumn(client, "users", "free_lng", "REAL");
  const database = wrap(client);
  await seedDatabase(database);
  return database;
}

const globalForDb = globalThis as unknown as { __navqironDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  if (!globalForDb.__navqironDb) {
    globalForDb.__navqironDb = prepareDatabase();
  }
  return globalForDb.__navqironDb;
}
