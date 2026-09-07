import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPg = Boolean(process.env.DATABASE_URL);

let pgPool = null;
let sqliteDb = null;

if (isPg) {
  console.log('[DB Engine]: Initializing PostgreSQL Cloud Database Connection...');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  const dataDir = process.env.DB_DIR || (fs.existsSync('/app/data') ? '/app/data' : path.join(__dirname, '..'));
  const dbPath = path.join(dataDir, 'glucotrack.db');
  console.log(`[DB Engine]: Initializing local SQLite database at ${dbPath}`);
  sqliteDb = new sqlite3.Database(dbPath);
}

// Convert SQLite ? parameters to PostgreSQL $1, $2, $3 placeholders if running on PG
function formatSql(sql) {
  if (!isPg) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export const db = {
  all: async (sql, params = []) => {
    if (isPg) {
      const res = await pgPool.query(formatSql(sql), params);
      return res.rows.map(r => ({
        ...r,
        value_mgdl: r.value_mgdl !== undefined ? parseFloat(r.value_mgdl) : undefined,
        original_value: r.original_value !== undefined ? parseFloat(r.original_value) : undefined,
      }));
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
      });
    }
  },
  get: async (sql, params = []) => {
    if (isPg) {
      const res = await pgPool.query(formatSql(sql), params);
      const r = res.rows[0];
      if (!r) return null;
      return {
        ...r,
        value_mgdl: r.value_mgdl !== undefined ? parseFloat(r.value_mgdl) : undefined,
        original_value: r.original_value !== undefined ? parseFloat(r.original_value) : undefined,
      };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
      });
    }
  },
  run: async (sql, params = []) => {
    if (isPg) {
      const res = await pgPool.query(formatSql(sql), params);
      return { changes: res.rowCount, lastID: null };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  },
  exec: async (sql) => {
    if (isPg) {
      await pgPool.query(sql);
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.exec(sql, (err) => (err ? reject(err) : resolve()));
      });
    }
  },
};

export async function initDatabase() {
  console.log(`[DB Schema]: Initializing tables for ${isPg ? 'PostgreSQL' : 'SQLite'}...`);

  if (isPg) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        full_name VARCHAR(255) NOT NULL,
        target_low_mgdl INT DEFAULT 70,
        target_high_mgdl INT DEFAULT 180,
        preferred_unit VARCHAR(50) DEFAULT 'mg/dL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS glucose_readings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        value_mgdl NUMERIC NOT NULL,
        original_value NUMERIC NOT NULL,
        original_unit VARCHAR(50) NOT NULL,
        meal_context VARCHAR(100) NOT NULL,
        notes TEXT,
        measured_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_readings_user_timestamp ON glucose_readings(user_id, measured_at DESC);

      CREATE TABLE IF NOT EXISTS ocr_audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        reading_id VARCHAR(255),
        image_url TEXT,
        raw_ai_response TEXT,
        confidence_score NUMERIC,
        is_user_edited INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_insights (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        period_days INT NOT NULL,
        summary_markdown TEXT NOT NULL,
        detected_patterns TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
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
      // Column exists
    }
  }
}

export default db;
