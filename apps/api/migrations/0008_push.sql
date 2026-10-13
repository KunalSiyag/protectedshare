-- Read notifications ("Tell me when it's opened") over Web Push.
--
-- The Worker also self-heals this schema at runtime (src/lib/schema.ts); every statement here is
-- idempotent, so running it on a database that already has them is harmless.

-- Browsers that asked to be told when a share is opened. Added with the share's manage token
-- (POST /api/manage/:kind/:id/watch), at most 5 per share. A row holds what Web Push needs to
-- reach that browser and nothing else: no content, no key, no account.
CREATE TABLE IF NOT EXISTS share_watchers (
  kind TEXT NOT NULL,               -- note | secret | drop | request (same as share_receipts)
  id TEXT NOT NULL,
  endpoint TEXT NOT NULL,           -- push service URL (allow-listed browser push services only)
  p256dh TEXT NOT NULL,             -- browser's P-256 public key, base64url (encrypts the message)
  auth TEXT NOT NULL,               -- browser's 16-byte auth secret, base64url
  created_at INTEGER NOT NULL,      -- epoch seconds
  PRIMARY KEY (kind, id, endpoint)
);

-- A watcher lives only as long as its share. Used-up shares drop theirs right after the last
-- notification is sent, and the 30-minute cron removes those of expired shares. Revoking (or a
-- takedown) and purging the receipt remove them here, whichever code path does it.
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
