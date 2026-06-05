CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  encrypted_blob TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_proof TEXT NOT NULL,
  is_burn_after_read INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
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
  created_at INTEGER NOT NULL
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
