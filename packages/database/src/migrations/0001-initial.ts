import { defineMigration } from '../migration.js';

export const initialMigration = defineMigration(
  1,
  'initial_entities',
  `
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY CHECK(length(trim(id)) BETWEEN 1 AND 128),
      display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 128),
      kind TEXT NOT NULL CHECK(kind IN ('microsoft', 'offline')),
      minecraft_name TEXT NOT NULL CHECK(length(trim(minecraft_name)) BETWEEN 1 AND 64),
      minecraft_uuid TEXT,
      credential_reference TEXT,
      connection_state TEXT NOT NULL DEFAULT 'disconnected'
        CHECK(connection_state IN ('disconnected', 'connected', 'reauth_required')),
      last_verified_at TEXT,
      provider_metadata_json TEXT NOT NULL DEFAULT '{}'
        CHECK(json_valid(provider_metadata_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(kind = 'microsoft' OR credential_reference IS NULL)
    ) STRICT;

    CREATE TABLE servers (
      id TEXT PRIMARY KEY CHECK(length(trim(id)) BETWEEN 1 AND 128),
      display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 128),
      host TEXT NOT NULL CHECK(length(trim(host)) BETWEEN 1 AND 253),
      port INTEGER NOT NULL DEFAULT 25565 CHECK(port BETWEEN 1 AND 65535),
      version_mode TEXT NOT NULL DEFAULT 'auto'
        CHECK(version_mode IN ('auto', 'manual')),
      minecraft_version TEXT,
      connection_options_json TEXT NOT NULL DEFAULT '{}'
        CHECK(json_valid(connection_options_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(
        (version_mode = 'auto' AND minecraft_version IS NULL) OR
        (version_mode = 'manual' AND minecraft_version IS NOT NULL AND length(trim(minecraft_version)) > 0)
      )
    ) STRICT;

    CREATE TABLE bot_profiles (
      id TEXT PRIMARY KEY CHECK(length(trim(id)) BETWEEN 1 AND 128),
      display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 128),
      account_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      engine_id TEXT NOT NULL DEFAULT 'mineflayer' CHECK(engine_id = 'mineflayer'),
      auto_start INTEGER NOT NULL DEFAULT 0 CHECK(auto_start IN (0, 1)),
      desired_state TEXT NOT NULL DEFAULT 'stopped'
        CHECK(desired_state IN ('stopped', 'running')),
      recovery_policy_json TEXT NOT NULL DEFAULT '{}'
        CHECK(json_valid(recovery_policy_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY(server_id) REFERENCES servers(id) ON DELETE RESTRICT
    ) STRICT;

    CREATE INDEX bot_profiles_account_id_idx ON bot_profiles(account_id);
    CREATE INDEX bot_profiles_server_id_idx ON bot_profiles(server_id);
  `,
);
