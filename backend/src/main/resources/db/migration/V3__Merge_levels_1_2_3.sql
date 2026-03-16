-- ── V3: Merge old levels 1, 2, 3 into a single Level 1 ───────────────────────
-- Old:  L1 (Sa/Pa), L2 (4 swaras), L3 (7 shuddha), L4 (12), L5 (seq2), L6 (seq3)
-- New:  L1 (7 shuddha),             L2 (12),         L3 (seq2),          L4 (seq3)
--
-- Order matters: remap highest numbers first to avoid collisions.
UPDATE game_sessions SET level = 4 WHERE level = 6;
UPDATE game_sessions SET level = 3 WHERE level = 5;
UPDATE game_sessions SET level = 2 WHERE level = 4;
UPDATE game_sessions SET level = 1 WHERE level IN (1, 2, 3);

-- Replace CHECK constraint (Postgres requires drop + re-add)
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_level_check;
ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_level_check
  CHECK (level BETWEEN 1 AND 4);
