import { defineMigration } from '../migration.js';

export const adminAuthMigration = defineMigration(
  2,
  'admin_auth',
  `
    CREATE TABLE administrator (
      singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1),
      display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 128),
      password_algorithm TEXT NOT NULL CHECK(password_algorithm = 'scrypt'),
      password_cost INTEGER NOT NULL CHECK(password_cost = 131072),
      password_block_size INTEGER NOT NULL CHECK(password_block_size = 8),
      password_parallelization INTEGER NOT NULL CHECK(password_parallelization = 1),
      password_key_length INTEGER NOT NULL CHECK(password_key_length = 64),
      password_salt TEXT NOT NULL CHECK(length(password_salt) = 22),
      password_hash TEXT NOT NULL CHECK(length(password_hash) = 86),
      credential_version INTEGER NOT NULL DEFAULT 1 CHECK(credential_version >= 1),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE admin_sessions (
      token_digest TEXT PRIMARY KEY CHECK(length(token_digest) = 43),
      administrator_id INTEGER NOT NULL DEFAULT 1 CHECK(administrator_id = 1),
      audience TEXT NOT NULL CHECK(audience IN ('loopback', 'lan')),
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      idle_expires_at TEXT NOT NULL,
      absolute_expires_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY(administrator_id) REFERENCES administrator(singleton_id) ON DELETE CASCADE
    ) STRICT;

    CREATE INDEX admin_sessions_expiry_idx
      ON admin_sessions(revoked_at, idle_expires_at, absolute_expires_at);
  `,
);
