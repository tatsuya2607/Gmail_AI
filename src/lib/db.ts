import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS read_messages (
    message_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    marked_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, account_id)
  );

  CREATE TABLE IF NOT EXISTS starred_messages (
    message_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    is_starred INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, account_id)
  );

  CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS label_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS local_trash (
    message_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    message_json TEXT NOT NULL,
    trashed_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, account_id)
  );
`);

export default db;
