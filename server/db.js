import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'glucotrack.db');
const sqlite = new sqlite3.Database(dbPath);

export const db = {
  all: (sql, params = []) =>
    new Promise((resolve, reject) => {
      sqlite.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    }),
  get: (sql, params = []) =>
    new Promise((resolve, reject) => {
      sqlite.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    }),
  run: (sql, params = []) =>
    new Promise((resolve, reject) => {
      sqlite.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }),
  exec: (sql) =>
    new Promise((resolve, reject) => {
      sqlite.exec(sql, (err) => (err ? reject(err) : resolve()));
    }),
};

export async function initDatabase() {
  console.log('[DB] Initializing clean SQLite database schema...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      target_low_mgdl INTEGER DEFAULT 70,
      target_high_mgdl INTEGER DEFAULT 180,
      preferred_unit TEXT DEFAULT 'mg/dL',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS glucose_readings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      value_mgdl REAL NOT NULL,
      original_value REAL NOT NULL,
      original_unit TEXT NOT NULL,
      meal_context TEXT NOT NULL,
      notes TEXT,
      measured_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_readings_user_timestamp ON glucose_readings(user_id, measured_at DESC);

    CREATE TABLE IF NOT EXISTS ocr_audit_logs (
      id TEXT PRIMARY KEY,
      reading_id TEXT,
      image_url TEXT,
      raw_ai_response TEXT,
      confidence_score REAL,
      is_user_edited INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reading_id) REFERENCES glucose_readings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      period_days INTEGER NOT NULL,
      summary_markdown TEXT NOT NULL,
      detected_patterns TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    await db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
  } catch (err) {
    // Column already exists
  }
}


export default db;
