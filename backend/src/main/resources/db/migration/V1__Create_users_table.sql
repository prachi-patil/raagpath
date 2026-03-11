-- ═══════════════════════════════════════════════════════
--  V1 — Create users table
--  Columns: id, email, password_hash, xp_total, created_at
-- ═══════════════════════════════════════════════════════

CREATE TABLE users (
    id            BIGSERIAL                   PRIMARY KEY,
    email         VARCHAR(255)                NOT NULL UNIQUE,
    password_hash VARCHAR(255)                NOT NULL,
    xp_total      INTEGER                     NOT NULL DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
