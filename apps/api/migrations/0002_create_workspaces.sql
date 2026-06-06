-- Creates workspaces table for edge-synced notepads
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
