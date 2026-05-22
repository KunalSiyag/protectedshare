-- Adds password proof fields used for password-verified fetch on notes/secrets.
ALTER TABLE notes ADD COLUMN password_proof TEXT;
ALTER TABLE secrets ADD COLUMN password_proof TEXT;
