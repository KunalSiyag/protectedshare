CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  encrypted_blob TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_proof TEXT NOT NULL,
  is_burn_after_read INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,  -- 2 = crypto v2; password_proof then holds SHA-256(auth token)
  kdf TEXT                             -- v2 only: key | password | key+password
);

CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON notes (expires_at);

CREATE TABLE IF NOT EXISTS secrets (
  id TEXT PRIMARY KEY,
  encrypted_blob TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_proof TEXT NOT NULL,
  is_burn_after_read INTEGER NOT NULL DEFAULT 1,
  reads_remaining INTEGER DEFAULT 1,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  kdf TEXT
);

CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets (expires_at);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  username TEXT PRIMARY KEY,
  password_proof TEXT NOT NULL,
  verifier_blob TEXT NOT NULL,
  verifier_iv TEXT NOT NULL,
  verifier_salt TEXT NOT NULL,
  vault_blob TEXT NOT NULL,
  vault_iv TEXT NOT NULL,
  vault_salt TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  encrypted_blob TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,      -- epoch ms
  expires_at INTEGER,               -- epoch ms; disappearing messages
  delete_hash TEXT,                 -- SHA-256(per-message delete token)
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires_at ON chat_messages (expires_at);

CREATE TABLE IF NOT EXISTS chat_room_presence (
  room_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  is_typing INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_presence_room_id ON chat_room_presence (room_id, last_seen);

CREATE TABLE IF NOT EXISTS share_receipts (
  kind TEXT NOT NULL,               -- note | secret | drop | request
  id TEXT NOT NULL,
  manage_hash TEXT NOT NULL,        -- SHA-256(manage token), base64url
  status TEXT NOT NULL DEFAULT 'active', -- active | consumed | expired | revoked
  reads INTEGER NOT NULL DEFAULT 0,
  max_reads INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  first_read_at INTEGER,
  last_read_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (kind, id)
);
CREATE INDEX IF NOT EXISTS idx_share_receipts_expires_at ON share_receipts (expires_at);

CREATE TABLE IF NOT EXISTS drops (
  id TEXT PRIMARY KEY,
  manifest_blob TEXT NOT NULL,
  manifest_iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  auth_hash TEXT NOT NULL,
  upload_hash TEXT NOT NULL,
  total_bytes INTEGER NOT NULL,
  chunk_count INTEGER NOT NULL,
  downloads_remaining INTEGER NOT NULL,
  is_complete INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drops_expires_at ON drops (expires_at);

CREATE TABLE IF NOT EXISTS drop_chunks (
  drop_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  data BLOB NOT NULL,               -- chunk bytes; empty when the bytes live in R2 (drops/<drop_id>/<idx>)
  size INTEGER,                     -- chunk bytes stored; NULL on rows written before R2 (use LENGTH(data))
  PRIMARY KEY (drop_id, idx)
);

CREATE TABLE IF NOT EXISTS drop_sessions (
  drop_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (drop_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_drop_sessions_expires_at ON drop_sessions (expires_at);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  label_blob TEXT,
  label_iv TEXT,
  inbox_hash TEXT NOT NULL,
  response_blob TEXT,
  response_iv TEXT,
  response_salt TEXT,
  response_epk TEXT,
  responded_at INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  respond_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_expires_at ON requests (expires_at);

CREATE TABLE IF NOT EXISTS chat_rooms (
  room_id TEXT PRIMARY KEY,
  auth_hash TEXT NOT NULL,          -- SHA-256(room auth token), base64url
  ttl_seconds INTEGER,              -- default disappearing timer (clients apply it)
  created_at INTEGER NOT NULL,      -- epoch ms
  last_active_at INTEGER NOT NULL   -- epoch ms
);

CREATE TABLE IF NOT EXISTS chat_deletions (
  room_id TEXT NOT NULL,
  message_id TEXT NOT NULL,         -- '__room__' marks a burned room
  deleted_at INTEGER NOT NULL,      -- epoch ms; purged after 10 minutes
  PRIMARY KEY (room_id, message_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_deletions_room ON chat_deletions (room_id, deleted_at);

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

-- Read notifications: browsers (Web Push subscriptions) told when a share is opened. At most 5
-- per share, added with its manage token, gone when the share is used up, revoked or expires.
CREATE TABLE IF NOT EXISTS share_watchers (
  kind TEXT NOT NULL,               -- note | secret | drop | request (same as share_receipts)
  id TEXT NOT NULL,
  endpoint TEXT NOT NULL,           -- push service URL (allow-listed browser push services only)
  p256dh TEXT NOT NULL,             -- browser's P-256 public key, base64url
  auth TEXT NOT NULL,               -- browser's 16-byte auth secret, base64url
  created_at INTEGER NOT NULL,      -- epoch seconds
  PRIMARY KEY (kind, id, endpoint)
);
CREATE TRIGGER IF NOT EXISTS share_watchers_on_revoke
AFTER UPDATE OF status ON share_receipts
WHEN NEW.status = 'revoked'
BEGIN
  DELETE FROM share_watchers WHERE kind = NEW.kind AND id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS share_watchers_on_receipt_delete
AFTER DELETE ON share_receipts
BEGIN
  DELETE FROM share_watchers WHERE kind = OLD.kind AND id = OLD.id;
END;
