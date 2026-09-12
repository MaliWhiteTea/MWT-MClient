import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  ADMIN_SESSION_IDLE_MS,
  digestSessionToken,
  type AdminPasswordVerifier,
  type AdminSessionRecord,
  type SecretReference,
  type SessionAudience,
} from '@mwt-mclient/core';

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

export interface CreateAdministratorInput {
  readonly displayName: string;
  readonly passwordVerifier: AdminPasswordVerifier;
}

export interface StoredAdministrator {
  readonly displayName: string;
  readonly passwordVerifier: AdminPasswordVerifier;
}

export type ActiveAdminSession = Omit<AdminSessionRecord, 'tokenDigest'>;

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

  hasAdministrator(): boolean {
    const row = this.#connection
      .prepare('SELECT COUNT(*) AS count FROM administrator')
      .get() as { count: number };
    return row.count === 1;
  }

  createAdministrator(input: CreateAdministratorInput): void {
    const timestamp = new Date().toISOString();
    const verifier = input.passwordVerifier;
    this.#connection
      .prepare(
        `INSERT INTO administrator
          (singleton_id, display_name, password_algorithm, password_cost,
           password_block_size, password_parallelization, password_key_length,
           password_salt, password_hash, created_at, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.displayName,
        verifier.algorithm,
        verifier.cost,
        verifier.blockSize,
        verifier.parallelization,
        verifier.keyLength,
        verifier.salt,
        verifier.hash,
        timestamp,
        timestamp,
      );
  }

  getAdministrator(): StoredAdministrator | null {
    const row = this.#connection
      .prepare(
        `SELECT display_name, password_algorithm, password_cost,
                password_block_size, password_parallelization,
                password_key_length, password_salt, password_hash
         FROM administrator WHERE singleton_id = 1`,
      )
      .get() as
      | {
          display_name: string;
          password_algorithm: 'scrypt';
          password_block_size: number;
          password_cost: number;
          password_hash: string;
          password_key_length: number;
          password_parallelization: number;
          password_salt: string;
        }
      | undefined;
    if (row === undefined) {
      return null;
    }
    return Object.freeze({
      displayName: row.display_name,
      passwordVerifier: Object.freeze({
        algorithm: row.password_algorithm,
        blockSize: row.password_block_size,
        cost: row.password_cost,
        hash: row.password_hash,
        keyLength: row.password_key_length,
        parallelization: row.password_parallelization,
        salt: row.password_salt,
      }),
    });
  }

  createAdminSession(session: AdminSessionRecord): void {
    this.#connection
      .prepare(
        `INSERT INTO admin_sessions
          (token_digest, audience, created_at, last_seen_at,
           idle_expires_at, absolute_expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        session.tokenDigest,
        session.audience,
        session.createdAt,
        session.lastSeenAt,
        session.idleExpiresAt,
        session.absoluteExpiresAt,
      );
  }

  resumeAdminSession(
    token: string,
    audience: SessionAudience,
    now = new Date(),
  ): ActiveAdminSession | null {
    const nowIso = now.toISOString();
    const proposedIdleExpiry = new Date(
      now.getTime() + ADMIN_SESSION_IDLE_MS,
    ).toISOString();
    const row = this.#connection
      .prepare(
        `UPDATE admin_sessions
         SET last_seen_at = ?,
             idle_expires_at = CASE
               WHEN absolute_expires_at < ? THEN absolute_expires_at
               ELSE ?
             END
         WHERE token_digest = ?
           AND audience = ?
           AND revoked_at IS NULL
           AND idle_expires_at > ?
           AND absolute_expires_at > ?
         RETURNING audience, created_at, last_seen_at,
                   idle_expires_at, absolute_expires_at`,
      )
      .get(
        nowIso,
        proposedIdleExpiry,
        proposedIdleExpiry,
        digestSessionToken(token),
        audience,
        nowIso,
        nowIso,
      ) as
      | {
          absolute_expires_at: string;
          audience: SessionAudience;
          created_at: string;
          idle_expires_at: string;
          last_seen_at: string;
        }
      | undefined;
    return row === undefined
      ? null
      : Object.freeze({
          absoluteExpiresAt: row.absolute_expires_at,
          audience: row.audience,
          createdAt: row.created_at,
          idleExpiresAt: row.idle_expires_at,
          lastSeenAt: row.last_seen_at,
        });
  }

  revokeAdminSession(token: string, revokedAt = new Date()): boolean {
    return (
      this.#connection
        .prepare(
          `UPDATE admin_sessions SET revoked_at = ?
           WHERE token_digest = ? AND revoked_at IS NULL`,
        )
        .run(revokedAt.toISOString(), digestSessionToken(token)).changes === 1
    );
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
