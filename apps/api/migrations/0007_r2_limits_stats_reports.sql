-- File-drop chunks in R2, usage counters, abuse reports and auth lockouts.
--
-- The Worker also self-heals this schema at runtime (src/lib/schema.ts). If it already ran
-- against this database, the ALTER TABLE at the end fails with "duplicate column name"; that
-- means it is already applied and the error is safe to ignore (the CREATE statements are
-- idempotent).

-- Successful creates per UTC day and kind (note | secret | drop | request | chat), for GET /api/stats.
CREATE TABLE IF NOT EXISTS usage_daily (
  day TEXT NOT NULL,                -- YYYY-MM-DD (UTC)
  kind TEXT NOT NULL,
  created INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);

-- Abuse reports from recipients (POST /api/reports). Never holds a link key. Purged after 180 days.
CREATE TABLE IF NOT EXISTS abuse_reports (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,               -- note | secret | drop | request
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,             -- malware | phishing | illegal | spam | other
  details TEXT,                     -- up to 500 characters
  contact TEXT,                     -- optional email
  created_at INTEGER NOT NULL       -- epoch seconds
);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_created_at ON abuse_reports (created_at);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_target ON abuse_reports (kind, target_id);

-- Targets locked after too many failed key/password attempts ('auth:<scope>:<id>').
CREATE TABLE IF NOT EXISTS auth_lockouts (
  key TEXT PRIMARY KEY,
  until INTEGER NOT NULL            -- epoch seconds
);

-- Chunk sizes. R2-backed rows keep an empty BLOB in `data`; NULL size = a row written before R2.
ALTER TABLE drop_chunks ADD COLUMN size INTEGER;
