-- Spending guard for file drops (src/lib/drop-budget.ts): a storage total and daily R2 operation
-- counts, so the API refuses new work at its caps instead of going past R2's free allowance.
--
-- The Worker also self-heals this schema at runtime (src/lib/schema.ts); every statement here is
-- idempotent, so running it on a database that already has them is harmless.

-- One row: the bytes of every stored file-drop chunk (R2 or D1). The triggers below keep it exact
-- whichever code path writes or deletes chunks; the cron also recounts it once a day.
CREATE TABLE IF NOT EXISTS drop_storage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bytes INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO drop_storage (id, bytes)
SELECT 1, COALESCE(SUM(COALESCE(size, LENGTH(data))), 0) FROM drop_chunks;

CREATE TRIGGER IF NOT EXISTS drop_storage_on_chunk_insert
AFTER INSERT ON drop_chunks
BEGIN
  UPDATE drop_storage SET bytes = bytes + COALESCE(NEW.size, LENGTH(NEW.data)) WHERE id = 1;
END;

-- A chunk sent again replaces the old one (the upload's ON CONFLICT ... DO UPDATE fires this).
CREATE TRIGGER IF NOT EXISTS drop_storage_on_chunk_update
AFTER UPDATE OF data, size ON drop_chunks
BEGIN
  UPDATE drop_storage
  SET bytes = bytes - COALESCE(OLD.size, LENGTH(OLD.data)) + COALESCE(NEW.size, LENGTH(NEW.data))
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS drop_storage_on_chunk_delete
AFTER DELETE ON drop_chunks
BEGIN
  UPDATE drop_storage SET bytes = bytes - COALESCE(OLD.size, LENGTH(OLD.data)) WHERE id = 1;
END;

-- R2 operations per UTC day, reserved before each call: no ids, no content. Kept 90 days.
CREATE TABLE IF NOT EXISTS r2_ops_daily (
  day TEXT PRIMARY KEY,             -- YYYY-MM-DD (UTC)
  class_a INTEGER NOT NULL DEFAULT 0, -- writes: put, list
  class_b INTEGER NOT NULL DEFAULT 0  -- reads: get
);
