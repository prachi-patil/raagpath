-- ═══════════════════════════════════════════════════════
--  V2 — Players + Game Sessions
--  players: lightweight username-based identity (no password)
--  game_sessions: per-level game results linked to a player
-- ═══════════════════════════════════════════════════════

-- Players (lightweight identity — no password required)
CREATE TABLE players (
  id             BIGSERIAL                   PRIMARY KEY,
  username       VARCHAR(50)                 NOT NULL,
  username_lower VARCHAR(50)                 NOT NULL UNIQUE,
  created_at     TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

-- Game sessions linked to players
CREATE TABLE game_sessions (
  id          BIGSERIAL                   PRIMARY KEY,
  player_id   BIGINT                      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level       INTEGER                     NOT NULL CHECK (level BETWEEN 1 AND 6),
  shruti      VARCHAR(3)                  NOT NULL,
  rounds_json JSONB                       NOT NULL DEFAULT '[]',
  total_score INTEGER                     NOT NULL DEFAULT 0,
  passed      BOOLEAN                     NOT NULL DEFAULT FALSE,
  played_at   TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gs_player_id ON game_sessions(player_id);
CREATE INDEX idx_gs_played_at ON game_sessions(played_at DESC);
