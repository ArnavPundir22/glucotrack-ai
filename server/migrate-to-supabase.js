import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error('❌ Error: Please provide TARGET_DATABASE_URL or DATABASE_URL environment variable.');
  console.error('\nUsage Example:');
  console.error('TARGET_DATABASE_URL="postgres://postgres.xxxx:your_password@aws-0-region.pooler.supabase.com:6543/postgres" node server/migrate-to-supabase.js\n');
  process.exit(1);
}

const sqliteDbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'glucotrack.db');

function formatDateForPg(val) {
  if (!val) return new Date().toISOString();
  if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
    const num = Number(val);
    const date = new Date(num > 1e11 ? num : num * 1000);
    return date.toISOString();
  }
  const date = new Date(val);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  return val;
}

async function migrateToSupabase() {
  console.log(`[Supabase Migrator]: Connecting to target Supabase PostgreSQL...`);
  const pgPool = new pg.Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log(`[Supabase Migrator]: Connecting to source SQLite database at ${sqliteDbPath}...`);
  const sqliteDb = new sqlite3.Database(sqliteDbPath);

  const fetchSqlite = (sql, params = []) => new Promise((res, rej) => {
    sqliteDb.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)));
  });

  try {
    console.log('[Supabase Migrator]: Creating PostgreSQL schema in Supabase...');
    await pgPool.query(`
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

    // 1. Users
    const users = await fetchSqlite('SELECT * FROM users');
    console.log(`[Supabase Migrator]: Uploading ${users.length} user records to Supabase...`);
    for (const u of users) {
      await pgPool.query(
        `INSERT INTO users (id, email, password_hash, full_name, target_low_mgdl, target_high_mgdl, preferred_unit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           target_low_mgdl = EXCLUDED.target_low_mgdl,
           target_high_mgdl = EXCLUDED.target_high_mgdl,
           preferred_unit = EXCLUDED.preferred_unit;`,
        [u.id, u.email, u.password_hash, u.full_name, u.target_low_mgdl, u.target_high_mgdl, u.preferred_unit, formatDateForPg(u.created_at)]
      );
    }

    // 2. Glucose Readings
    const readings = await fetchSqlite('SELECT * FROM glucose_readings');
    console.log(`[Supabase Migrator]: Uploading ${readings.length} glucose reading records to Supabase...`);
    for (const r of readings) {
      await pgPool.query(
        `INSERT INTO glucose_readings (id, user_id, value_mgdl, original_value, original_unit, meal_context, notes, measured_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           value_mgdl = EXCLUDED.value_mgdl,
           original_value = EXCLUDED.original_value,
           original_unit = EXCLUDED.original_unit,
           meal_context = EXCLUDED.meal_context,
           notes = EXCLUDED.notes,
           measured_at = EXCLUDED.measured_at;`,
        [r.id, r.user_id, r.value_mgdl, r.original_value, r.original_unit, r.meal_context, r.notes, formatDateForPg(r.measured_at), formatDateForPg(r.created_at)]
      );
    }

    // 3. OCR Audit Logs
    const ocrLogs = await fetchSqlite('SELECT * FROM ocr_audit_logs');
    console.log(`[Supabase Migrator]: Uploading ${ocrLogs.length} OCR audit logs to Supabase...`);
    for (const o of ocrLogs) {
      await pgPool.query(
        `INSERT INTO ocr_audit_logs (id, reading_id, image_url, raw_ai_response, confidence_score, is_user_edited, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           reading_id = EXCLUDED.reading_id,
           image_url = EXCLUDED.image_url,
           raw_ai_response = EXCLUDED.raw_ai_response,
           confidence_score = EXCLUDED.confidence_score,
           is_user_edited = EXCLUDED.is_user_edited;`,
        [o.id, o.reading_id, o.image_url, o.raw_ai_response, o.confidence_score, o.is_user_edited, formatDateForPg(o.created_at)]
      );
    }

    // 4. AI Insights
    const insights = await fetchSqlite('SELECT * FROM ai_insights');
    console.log(`[Supabase Migrator]: Uploading ${insights.length} AI insights to Supabase...`);
    for (const i of insights) {
      await pgPool.query(
        `INSERT INTO ai_insights (id, user_id, period_days, summary_markdown, detected_patterns, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           period_days = EXCLUDED.period_days,
           summary_markdown = EXCLUDED.summary_markdown,
           detected_patterns = EXCLUDED.detected_patterns;`,
        [i.id, i.user_id, i.period_days, i.summary_markdown, i.detected_patterns, formatDateForPg(i.created_at)]
      );
    }

    console.log('\n🎉 [Supabase Migrator]: Migration to Supabase DB completed successfully!\n');
  } catch (err) {
    console.error('❌ [Supabase Migrator]: Upload failed:', err);
  } finally {
    await pgPool.end();
    sqliteDb.close();
  }
}

migrateToSupabase();
