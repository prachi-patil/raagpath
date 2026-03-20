-- ── V4: Expand level range to 1–6 for komal/tivra levels ────────────────────
-- V3 tightened the constraint to 1–4. We now add levels 5 (shuddha+komal)
-- and 6 (all 12 swaras incl. tivra Ma), so we need to allow 1–6 again.
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_level_check;
ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_level_check
  CHECK (level BETWEEN 1 AND 6);
