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
