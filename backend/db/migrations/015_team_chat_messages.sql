CREATE TABLE IF NOT EXISTS team_chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  group_id VARCHAR(64),
  sender_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  receiver_id VARCHAR(64) NOT NULL,
  receiver_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_participants ON team_chat_messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON team_chat_messages (receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_group ON team_chat_messages (group_id, receiver_id);
