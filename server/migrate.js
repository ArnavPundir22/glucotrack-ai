import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error('Error: Please provide SOURCE_DATABASE_URL or DATABASE_URL environment variable.');
  console.error('Example command:');
  console.error('SOURCE_DATABASE_URL="postgres://..." node server/migrate.js');
  process.exit(1);
}

const targetDbPath = process.env.TARGET_DB_PATH || path.join(__dirname, '..', 'glucotrack.db');

async function migrate() {
  console.log(`[Migrator]: Connecting to Source PostgreSQL...`);
  const pgPool = new pg.Pool({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log(`[Migrator]: Connecting to Target SQLite database at ${targetDbPath}...`);
  const sqliteDb = new sqlite3.Database(targetDbPath);

  const runSqlite = (sql, params = []) => new Promise((res, rej) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) rej(err);
      else res(this);
    });
  });

  const execSqlite = (sql) => new Promise((res, rej) => {
    sqliteDb.exec(sql, (err) => (err ? rej(err) : res()));
  });

  console.log('[Migrator]: Ensuring target SQLite schema exists...');
  await execSqlite(`
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
    // 1. Users
    const usersRes = await pgPool.query('SELECT * FROM users');
    console.log(`[Migrator]: Copying ${usersRes.rows.length} user records...`);
    for (const u of usersRes.rows) {
      await runSqlite(
        `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, target_low_mgdl, target_high_mgdl, preferred_unit, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.email, u.password_hash, u.full_name, u.target_low_mgdl, u.target_high_mgdl, u.preferred_unit, u.created_at]
      );
    }

    // 2. Glucose Readings
    const readingsRes = await pgPool.query('SELECT * FROM glucose_readings');
    console.log(`[Migrator]: Copying ${readingsRes.rows.length} glucose reading records...`);
    for (const r of readingsRes.rows) {
      await runSqlite(
        `INSERT OR REPLACE INTO glucose_readings (id, user_id, value_mgdl, original_value, original_unit, meal_context, notes, measured_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.user_id, parseFloat(r.value_mgdl), parseFloat(r.original_value), r.original_unit, r.meal_context, r.notes, r.measured_at, r.created_at]
      );
    }

    // 3. OCR Audit Logs
    const ocrRes = await pgPool.query('SELECT * FROM ocr_audit_logs');
    console.log(`[Migrator]: Copying ${ocrRes.rows.length} OCR audit log records...`);
    for (const o of ocrRes.rows) {
      await runSqlite(
        `INSERT OR REPLACE INTO ocr_audit_logs (id, reading_id, image_url, raw_ai_response, confidence_score, is_user_edited, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [o.id, o.reading_id, o.image_url, o.raw_ai_response, o.confidence_score ? parseFloat(o.confidence_score) : null, o.is_user_edited, o.created_at]
      );
    }

    // 4. AI Insights
    const insightsRes = await pgPool.query('SELECT * FROM ai_insights');
    console.log(`[Migrator]: Copying ${insightsRes.rows.length} AI insight records...`);
    for (const i of insightsRes.rows) {
      await runSqlite(
        `INSERT OR REPLACE INTO ai_insights (id, user_id, period_days, summary_markdown, detected_patterns, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [i.id, i.user_id, i.period_days, i.summary_markdown, i.detected_patterns, i.created_at]
      );
    }

    console.log('✅ [Migrator]: Database migration completed successfully!');
  } catch (err) {
    console.error('❌ [Migrator]: Migration failed:', err);
  } finally {
    await pgPool.end();
    sqliteDb.close();
  }
}

migrate();
