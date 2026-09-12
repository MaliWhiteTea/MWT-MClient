import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import type { SecretReference } from '@mwt-mclient/core';

import { SqliteMigrationRunner } from './migration.js';
import { migrations as defaultMigrations } from './migrations/index.js';

export const DEFAULT_BUSY_TIMEOUT_MS = 5_000;

export interface OpenDatabaseOptions {
  readonly busyTimeoutMs?: number;
  readonly path: string;
}

export interface DatabaseDiagnostics {
  readonly busyTimeoutMs: number;
  readonly foreignKeysEnabled: boolean;
  readonly journalMode: string;
  readonly recoveryCleanupPendingCount: number;
  readonly schemaVersion: number;
}

interface AccountBase {
  readonly displayName: string;
  readonly minecraftName: string;
  readonly minecraftUuid?: string;
}

export type CreateAccountInput = AccountBase &
  (
    | { readonly kind: 'offline' }
    | {
        readonly credentialReference?: SecretReference;
        readonly kind: 'microsoft';
      }
  );

interface ServerBase {
  readonly displayName: string;
  readonly host: string;
  readonly port?: number;
}

export type CreateServerInput = ServerBase &
  (
    | { readonly versionMode: 'auto' }
    | {
        readonly minecraftVersion: string;
        readonly versionMode: 'manual';
      }
  );

export interface CreateBotProfileInput {
  readonly accountId: string;
  readonly autoStart?: boolean;
  readonly displayName: string;
  readonly serverId: string;
}

export class ControlDatabase implements Disposable {
  readonly #connection: DatabaseSync;
  readonly #diagnostics: DatabaseDiagnostics;

  private constructor(
    connection: DatabaseSync,
    diagnostics: DatabaseDiagnostics,
  ) {
    this.#connection = connection;
    this.#diagnostics = diagnostics;
  }

  static async open(options: OpenDatabaseOptions): Promise<ControlDatabase> {
    const busyTimeoutMs = options.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS;
    if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {
      throw new RangeError('busyTimeoutMs must be a non-negative integer');
    }

    const connection = new DatabaseSync(options.path, {
      enableDoubleQuotedStringLiterals: false,
      enableForeignKeyConstraints: true,
    });
    try {
      const runner = new SqliteMigrationRunner(connection, options.path);
      const migrationInspection = runner.inspect(defaultMigrations);

      connection.exec(`
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = ${busyTimeoutMs};
        PRAGMA trusted_schema = OFF;
      `);

      if (options.path !== ':memory:') {
        const row = connection.prepare('PRAGMA journal_mode = WAL').get() as {
          journal_mode: string;
        };
        if (row.journal_mode.toLowerCase() !== 'wal') {
          throw new Error('SQLite WAL mode could not be enabled');
        }
      }

      const migrationOutcome = await runner.migrate(
        defaultMigrations,
        migrationInspection,
      );
      const journalMode = (
        connection.prepare('PRAGMA journal_mode').get() as {
          journal_mode: string;
        }
      ).journal_mode;
      return new ControlDatabase(
        connection,
        Object.freeze({
          busyTimeoutMs,
          foreignKeysEnabled: true,
          journalMode,
          recoveryCleanupPendingCount:
            migrationOutcome.recoveryCleanupPendingCount,
          schemaVersion: migrationOutcome.currentVersion,
        }),
      );
    } catch (error) {
      connection.close();
      throw error;
    }
  }

  createAccount(input: CreateAccountInput): string {
    if (input.kind === 'offline' && 'credentialReference' in input) {
      throw new TypeError(
        'Offline accounts cannot contain a credential reference',
      );
    }

    const id = `account_${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const credentialReference =
      input.kind === 'microsoft' ? (input.credentialReference ?? null) : null;
    this.#connection
      .prepare(
        `INSERT INTO accounts
          (id, display_name, kind, minecraft_name, minecraft_uuid,
           credential_reference, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.displayName,
        input.kind,
        input.minecraftName,
        input.minecraftUuid ?? null,
        credentialReference,
        timestamp,
        timestamp,
      );
    return id;
  }

  createServer(input: CreateServerInput): string {
    const id = `server_${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const minecraftVersion =
      input.versionMode === 'manual' ? input.minecraftVersion : null;
    this.#connection
      .prepare(
        `INSERT INTO servers
          (id, display_name, host, port, version_mode, minecraft_version,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.displayName,
        input.host,
        input.port ?? 25_565,
        input.versionMode,
        minecraftVersion,
        timestamp,
        timestamp,
      );
    return id;
  }

  createBotProfile(input: CreateBotProfileInput): string {
    const id = `profile_${randomUUID()}`;
    const timestamp = new Date().toISOString();
    this.#connection
      .prepare(
        `INSERT INTO bot_profiles
          (id, display_name, account_id, server_id, auto_start,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.displayName,
        input.accountId,
        input.serverId,
        input.autoStart === true ? 1 : 0,
        timestamp,
        timestamp,
      );
    return id;
  }

  deleteAccount(id: string): boolean {
    return (
      this.#connection.prepare('DELETE FROM accounts WHERE id = ?').run(id)
        .changes === 1
    );
  }

  listBotProfileIds(): readonly string[] {
    const rows = this.#connection
      .prepare('SELECT id FROM bot_profiles ORDER BY created_at, id')
      .all() as unknown as { id: string }[];
    return Object.freeze(rows.map((row) => row.id));
  }

  diagnostics(): DatabaseDiagnostics {
    return this.#diagnostics;
  }

  close(): void {
    this.#connection.close();
  }

  [Symbol.dispose](): void {
    this.close();
  }
}

export async function openControlDatabase(
  options: OpenDatabaseOptions,
): Promise<ControlDatabase> {
  return ControlDatabase.open(options);
}
