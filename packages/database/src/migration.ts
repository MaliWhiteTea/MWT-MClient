import { createHash, randomUUID } from 'node:crypto';
import { readdir, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { backup, type DatabaseSync } from 'node:sqlite';

export interface SqlMigration {
  readonly checksum: string;
  readonly id: number;
  readonly name: string;
  readonly sql: string;
}

interface AppliedMigrationRow {
  readonly checksum: string;
  readonly id: number;
  readonly name: string;
}

export interface MigrationOutcome {
  readonly currentVersion: number;
  readonly recoveryCleanupPendingCount: number;
}

export interface MigrationInspection {
  readonly appliedCount: number;
  readonly currentVersion: number;
}

export class InvalidMigrationSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMigrationSetError';
  }
}

export class MigrationIntegrityError extends Error {
  constructor(
    public readonly migrationId: number,
    options?: ErrorOptions,
  ) {
    super(`Migration history does not match migration ${migrationId}`, options);
    this.name = 'MigrationIntegrityError';
  }
}

export class SchemaTooNewError extends Error {
  constructor(
    public readonly databaseVersion: number,
    public readonly supportedVersion: number,
  ) {
    super(
      `Database schema ${databaseVersion} is newer than supported schema ${supportedVersion}`,
    );
    this.name = 'SchemaTooNewError';
  }
}

export class MigrationFailedError extends Error {
  constructor(
    public readonly migrationId: number,
    public readonly recoverySnapshotPath: string | null,
    options: ErrorOptions,
  ) {
    super(`Migration ${migrationId} failed`, options);
    this.name = 'MigrationFailedError';
  }
}

export function defineMigration(
  id: number,
  name: string,
  sql: string,
): SqlMigration {
  return Object.freeze({
    checksum: createHash('sha256').update(sql, 'utf8').digest('hex'),
    id,
    name,
    sql,
  });
}

export class SqliteMigrationRunner {
  constructor(
    private readonly database: DatabaseSync,
    private readonly databasePath: string,
  ) {}

  currentVersion(): number {
    if (!this.hasLedger()) {
      return 0;
    }
    const row = this.database
      .prepare('SELECT COALESCE(MAX(id), 0) AS version FROM schema_migrations')
      .get() as { version: number };
    return row.version;
  }

  inspect(migrations: readonly SqlMigration[]): MigrationInspection {
    validateMigrationSet(migrations);
    const applied = this.readAppliedMigrations();
    const latestSupported = migrations.at(-1)?.id ?? 0;
    const current = applied.at(-1)?.id ?? 0;

    if (current > latestSupported) {
      throw new SchemaTooNewError(current, latestSupported);
    }

    for (let index = 0; index < applied.length; index += 1) {
      const actual = applied[index];
      const expected = migrations[index];
      if (
        actual === undefined ||
        expected === undefined ||
        actual.id !== expected.id ||
        actual.name !== expected.name ||
        actual.checksum !== expected.checksum
      ) {
        throw new MigrationIntegrityError(actual?.id ?? expected?.id ?? 0);
      }
    }

    return Object.freeze({
      appliedCount: applied.length,
      currentVersion: current,
    });
  }

  async migrate(
    migrations: readonly SqlMigration[],
    inspection?: MigrationInspection,
  ): Promise<MigrationOutcome> {
    validateMigrationSet(migrations);
    const accepted = inspection ?? this.inspect(migrations);

    let recoveryCleanupPendingCount =
      await this.cleanupCommittedRecoverySnapshots(accepted.currentVersion);
    for (const migration of migrations.slice(accepted.appliedCount)) {
      recoveryCleanupPendingCount += await this.apply(migration);
    }

    return Object.freeze({
      currentVersion: migrations.at(-1)?.id ?? accepted.currentVersion,
      recoveryCleanupPendingCount,
    });
  }

  private async apply(migration: SqlMigration): Promise<number> {
    const recoverySnapshotPath = await this.createRecoverySnapshot(
      migration.id,
    );

    this.database.exec('BEGIN IMMEDIATE');
    let transactionOpen = true;
    try {
      this.ensureLedger();
      this.database.exec(migration.sql);
      this.database
        .prepare(
          `INSERT INTO schema_migrations (id, name, checksum, applied_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(
          migration.id,
          migration.name,
          migration.checksum,
          new Date().toISOString(),
        );
      this.database.exec('COMMIT');
      transactionOpen = false;
    } catch (cause) {
      let failureCause = cause;
      if (transactionOpen) {
        try {
          this.database.exec('ROLLBACK');
        } catch (rollbackCause) {
          failureCause = new AggregateError(
            [cause, rollbackCause],
            'Migration and rollback both failed',
          );
        }
      }
      throw new MigrationFailedError(migration.id, recoverySnapshotPath, {
        cause: failureCause,
      });
    }

    if (recoverySnapshotPath !== null) {
      try {
        await rm(recoverySnapshotPath, { force: true });
      } catch {
        return 1;
      }
    }
    return 0;
  }

  private async createRecoverySnapshot(
    migrationId: number,
  ): Promise<string | null> {
    if (this.databasePath === ':memory:') {
      return null;
    }

    const snapshotPath = `${this.databasePath}.recovery-${migrationId}-${randomUUID()}.sqlite`;
    await backup(this.database, snapshotPath);
    return snapshotPath;
  }

  private ensureLedger(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL CHECK(length(checksum) = 64),
        applied_at TEXT NOT NULL
      ) STRICT;
    `);
  }

  private hasLedger(): boolean {
    const row = this.database
      .prepare(
        `SELECT COUNT(*) AS count FROM sqlite_master
         WHERE type = 'table' AND name = 'schema_migrations'`,
      )
      .get() as { count: number };
    return row.count === 1;
  }

  private readAppliedMigrations(): AppliedMigrationRow[] {
    if (!this.hasLedger()) {
      return [];
    }

    try {
      return this.database
        .prepare(
          'SELECT id, name, checksum FROM schema_migrations ORDER BY id ASC',
        )
        .all() as unknown as AppliedMigrationRow[];
    } catch (cause) {
      throw new MigrationIntegrityError(0, { cause });
    }
  }

  private async cleanupCommittedRecoverySnapshots(
    currentVersion: number,
  ): Promise<number> {
    if (this.databasePath === ':memory:' || currentVersion === 0) {
      return 0;
    }

    const directory = dirname(this.databasePath);
    const prefix = `${basename(this.databasePath)}.recovery-`;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return 1;
    }

    let pendingCount = 0;
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.startsWith(prefix)) {
        continue;
      }

      const suffix = entry.name.slice(prefix.length);
      const match =
        /^(\d+)-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.sqlite$/i.exec(
          suffix,
        );
      const migrationId = Number(match?.[1]);
      if (
        match === null ||
        !Number.isSafeInteger(migrationId) ||
        migrationId > currentVersion
      ) {
        continue;
      }

      try {
        await rm(join(directory, entry.name), { force: true });
      } catch {
        pendingCount += 1;
      }
    }
    return pendingCount;
  }
}

function validateMigrationSet(migrations: readonly SqlMigration[]): void {
  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index];
    const expectedId = index + 1;

    if (migration === undefined || migration.id !== expectedId) {
      throw new InvalidMigrationSetError(
        `Migration ids must be contiguous and start at 1; expected ${expectedId}`,
      );
    }

    if (!/^[a-z][a-z0-9_]{0,63}$/.test(migration.name)) {
      throw new InvalidMigrationSetError(
        `Migration ${migration.id} has an invalid name`,
      );
    }

    const actualChecksum = createHash('sha256')
      .update(migration.sql, 'utf8')
      .digest('hex');
    if (actualChecksum !== migration.checksum) {
      throw new InvalidMigrationSetError(
        `Migration ${migration.id} has an invalid checksum`,
      );
    }

    rejectTransactionControl(migration);
  }
}

function rejectTransactionControl(migration: SqlMigration): void {
  const statements = stripSqlLiteralsAndComments(migration.sql).split(';');
  const transactionStatement =
    /^(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b|^END(?:\s+(?:TRANSACTION|WORK))?\s*$/i;
  if (
    statements.some((statement) => transactionStatement.test(statement.trim()))
  ) {
    throw new InvalidMigrationSetError(
      `Migration ${migration.id} contains transaction control SQL`,
    );
  }
}

function stripSqlLiteralsAndComments(sql: string): string {
  let result = '';
  let index = 0;

  while (index < sql.length) {
    const character = sql[index];
    const next = sql[index + 1];

    if (character === '-' && next === '-') {
      result += '  ';
      index += 2;
      while (index < sql.length && sql[index] !== '\n') {
        result += ' ';
        index += 1;
      }
      continue;
    }

    if (character === '/' && next === '*') {
      result += '  ';
      index += 2;
      while (
        index < sql.length &&
        !(sql[index] === '*' && sql[index + 1] === '/')
      ) {
        result += sql[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      if (index < sql.length) {
        result += '  ';
        index += 2;
      }
      continue;
    }

    const closingQuote =
      character === "'" || character === '"' || character === '`'
        ? character
        : character === '['
          ? ']'
          : null;
    if (closingQuote !== null) {
      result += ' ';
      index += 1;
      while (index < sql.length) {
        if (sql[index] === closingQuote) {
          if (sql[index + 1] === closingQuote && closingQuote !== ']') {
            result += '  ';
            index += 2;
            continue;
          }
          result += ' ';
          index += 1;
          break;
        }
        result += sql[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
}
