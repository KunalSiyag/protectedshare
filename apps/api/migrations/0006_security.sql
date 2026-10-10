-- Security fixes: secret-request respond tokens and server-counted drop downloads.
--
-- The Worker also self-heals this schema at runtime (src/lib/schema.ts). If it already
-- ran against this database, the ALTER TABLE below fails with "duplicate column name";
-- that means it is already applied and the error is safe to ignore.

-- One download session per started drop download. Chunk GETs and /consume need its token.
CREATE TABLE IF NOT EXISTS drop_sessions (
  drop_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,         -- SHA-256(download token), base64url
  expires_at INTEGER NOT NULL,      -- epoch seconds (60 minutes, capped at the drop's expiry)
  created_at INTEGER NOT NULL,
  PRIMARY KEY (drop_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_drop_sessions_expires_at ON drop_sessions (expires_at);

-- SHA-256 of the respond token derived from the request link key (#k=). NULL = legacy row.
ALTER TABLE requests ADD COLUMN respond_hash TEXT;
