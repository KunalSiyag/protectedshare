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
  data BLOB NOT NULL,
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
