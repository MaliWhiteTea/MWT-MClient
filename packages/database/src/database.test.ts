import { copyFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

import {
  type CreateAccountInput,
  type CreateServerInput,
  openControlDatabase,
} from './database.js';
import {
  InvalidMigrationSetError,
  MigrationFailedError,
  MigrationIntegrityError,
  SchemaTooNewError,
  SqliteMigrationRunner,
  defineMigration,
} from './migration.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  );
});

async function temporaryDatabasePath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mwt-mclient-database-'));
  temporaryDirectories.push(directory);
  return join(directory, 'mwt-mclient.sqlite');
}

describe('control database', () => {
  it('enables required pragmas and records the initial migration', async () => {
    const path = await temporaryDatabasePath();
    const database = await openControlDatabase({ path });

    expect(database.diagnostics()).toEqual({
      busyTimeoutMs: 5_000,
      foreignKeysEnabled: true,
      journalMode: 'wal',
      recoveryCleanupPendingCount: 0,
      schemaVersion: 1,
    });
    database.close();

    const inspection = new DatabaseSync(path, { readOnly: true });
    expect(
      inspection
        .prepare(
          'SELECT id, name, length(checksum) AS checksumLength FROM schema_migrations',
        )
        .get(),
    ).toEqual({ checksumLength: 64, id: 1, name: 'initial_entities' });
    inspection.close();

    const files = await readdir(join(path, '..'));
    expect(files.some((file) => file.includes('.recovery-'))).toBe(false);
  });

  it('allows multiple profiles to share the same account and server', async () => {
    using database = await openControlDatabase({ path: ':memory:' });
    const accountId = database.createAccount({
      displayName: 'Hesap',
      kind: 'offline',
      minecraftName: 'Player',
    });
    const serverId = database.createServer({
      displayName: 'Sunucu',
      host: 'localhost',
      versionMode: 'auto',
    });

    database.createBotProfile({
      accountId,
      displayName: 'Bot 1',
      serverId,
    });
    database.createBotProfile({
      accountId,
      displayName: 'Bot 2',
      serverId,
    });

    expect(database.listBotProfileIds()).toHaveLength(2);
    expect(() => database.deleteAccount(accountId)).toThrow();
  });

  it('enforces secret, version, and engine boundaries in the schema', async () => {
    const path = await temporaryDatabasePath();
    const database = await openControlDatabase({ path });

    try {
      expect(() =>
        database.createAccount({
          credentialReference: 'vault-reference',
          displayName: 'Offline',
          kind: 'offline',
          minecraftName: 'Player',
        } as unknown as CreateAccountInput),
      ).toThrow();
      expect(() =>
        database.createServer({
          displayName: 'Sunucu',
          host: 'localhost',
          versionMode: 'manual',
        } as CreateServerInput),
      ).toThrow();
    } finally {
      database.close();
    }

    const rawDatabase = new DatabaseSync(path);
    const timestamp = new Date().toISOString();
    rawDatabase
      .prepare(
        `INSERT INTO accounts
          (id, display_name, kind, minecraft_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run('account-1', 'Hesap', 'offline', 'Player', timestamp, timestamp);
    rawDatabase
      .prepare(
        `INSERT INTO servers
          (id, display_name, host, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('server-1', 'Sunucu', 'localhost', timestamp, timestamp);
    expect(() =>
      rawDatabase
        .prepare(
          `INSERT INTO bot_profiles
            (id, display_name, account_id, server_id, engine_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          'profile-1',
          'Bot',
          'account-1',
          'server-1',
          'headlessmc',
          timestamp,
          timestamp,
        ),
    ).toThrow();

    const accountColumns = rawDatabase
      .prepare('PRAGMA table_info(accounts)')
      .all()
      .map((row) => (row as { name: string }).name);
    expect(accountColumns).not.toContain('password');
    expect(accountColumns).not.toContain('access_token');
    expect(accountColumns).not.toContain('refresh_token');
    rawDatabase.close();
  });

  it('rejects a changed checksum in applied migration history', async () => {
    const path = await temporaryDatabasePath();
    const database = await openControlDatabase({ path });
    database.close();

    const tamper = new DatabaseSync(path);
    tamper
      .prepare('UPDATE schema_migrations SET checksum = ? WHERE id = 1')
      .run('0'.repeat(64));
    tamper.close();

    await expect(openControlDatabase({ path })).rejects.toBeInstanceOf(
      MigrationIntegrityError,
    );
  });

  it('rejects a database schema newer than the application', async () => {
    const path = await temporaryDatabasePath();
    const future = new DatabaseSync(path);
    future.exec(`
      CREATE TABLE schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL CHECK(length(checksum) = 64),
        applied_at TEXT NOT NULL
      ) STRICT;
    `);
    future
      .prepare(
        `INSERT INTO schema_migrations (id, name, checksum, applied_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(2, 'future_schema', 'f'.repeat(64), new Date().toISOString());
    expect(future.prepare('PRAGMA journal_mode').get()).toEqual({
      journal_mode: 'delete',
    });
    future.close();

    await expect(openControlDatabase({ path })).rejects.toBeInstanceOf(
      SchemaTooNewError,
    );

    const unchanged = new DatabaseSync(path, { readOnly: true });
    expect(unchanged.prepare('PRAGMA journal_mode').get()).toEqual({
      journal_mode: 'delete',
    });
    unchanged.close();
  });

  it('rejects migration-owned transaction control before changing the database', async () => {
    const path = await temporaryDatabasePath();
    const connection = new DatabaseSync(path);
    const runner = new SqliteMigrationRunner(connection, path);
    const unsafeMigration = defineMigration(
      1,
      'unsafe_transaction',
      `CREATE TABLE must_not_exist (id INTEGER);
       COMMIT;`,
    );

    await expect(runner.migrate([unsafeMigration])).rejects.toBeInstanceOf(
      InvalidMigrationSetError,
    );
    expect(
      connection
        .prepare(
          `SELECT COUNT(*) AS count FROM sqlite_master
           WHERE type = 'table' AND name IN ('must_not_exist', 'schema_migrations')`,
        )
        .get(),
    ).toEqual({ count: 0 });
    connection.close();
  });

  it('rolls back the ledger and schema while preserving a failed migration snapshot', async () => {
    const path = await temporaryDatabasePath();
    const brokenMigration = defineMigration(
      1,
      'broken_schema',
      'CREATE TABLE must_rollback (id INTEGER); INVALID SQL;',
    );

    const migrationDatabase = new DatabaseSync(path);
    const runner = new SqliteMigrationRunner(migrationDatabase, path);
    const error = await runner
      .migrate([brokenMigration])
      .catch((caught: unknown) => caught);
    migrationDatabase.close();

    expect(error).toBeInstanceOf(MigrationFailedError);
    expect((error as MigrationFailedError).recoverySnapshotPath).not.toBeNull();

    const rawDatabase = new DatabaseSync(path);
    expect(
      rawDatabase
        .prepare(
          `SELECT COUNT(*) AS count FROM sqlite_master
           WHERE type = 'table' AND name IN ('must_rollback', 'schema_migrations')`,
        )
        .get(),
    ).toEqual({ count: 0 });
    rawDatabase.close();

    const files = await readdir(join(path, '..'));
    expect(files.some((file) => file.includes('.recovery-1-'))).toBe(true);
  });

  it('removes only committed migration snapshots during startup reconciliation', async () => {
    const path = await temporaryDatabasePath();
    const database = await openControlDatabase({ path });
    database.close();

    const committedSnapshot = `${path}.recovery-1-00000000-0000-4000-8000-000000000001.sqlite`;
    const failedSnapshot = `${path}.recovery-2-00000000-0000-4000-8000-000000000002.sqlite`;
    const unrelatedFile = `${path}.recovery-not-owned.sqlite`;
    await copyFile(path, committedSnapshot);
    await copyFile(path, failedSnapshot);
    await copyFile(path, unrelatedFile);

    using reopened = await openControlDatabase({ path });
    expect(reopened.diagnostics().recoveryCleanupPendingCount).toBe(0);

    const files = await readdir(join(path, '..'));
    expect(files).not.toContain(committedSnapshot.split(/[\\/]/).at(-1));
    expect(files).toContain(failedSnapshot.split(/[\\/]/).at(-1));
    expect(files).toContain(unrelatedFile.split(/[\\/]/).at(-1));
  });
});
