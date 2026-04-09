import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, "../data"), { recursive: true });
const db = new Database(join(__dirname, "../data/internpilot.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    resume_type TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'To Apply',
    date        TEXT NOT NULL,
    job_text    TEXT,
    url         TEXT,
    source      TEXT,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS resumes (
    track       TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    content     TEXT NOT NULL,
    updated_at  INTEGER DEFAULT (unixepoch())
  );
`);

export default db;
