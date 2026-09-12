import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseDiagnostics } from '@mwt-mclient/database';
import type { FastifyInstance } from 'fastify';

import { createControlService } from './app.js';

const apps: FastifyInstance[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  );
});

async function temporaryDatabasePath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mwt-control-service-'));
  temporaryDirectories.push(directory);
  return join(directory, 'mwt-mclient.sqlite');
}

describe('control service contract', () => {
  it('opens and migrates the database before reporting readiness', async () => {
    const app = await createControlService({
      databasePath: await temporaryDatabasePath(),
    });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      databaseReady: true,
      databaseSchemaVersion: 1,
      product: 'MWT-MClient',
      setupPhase: 'bootstrap',
    });
    expect(app.server.listening).toBe(false);
  });

  it('closes the database during service shutdown', async () => {
    const close = vi.fn();
    const diagnostics: DatabaseDiagnostics = {
      busyTimeoutMs: 5_000,
      foreignKeysEnabled: true,
      journalMode: 'wal',
      recoveryCleanupPendingCount: 0,
      schemaVersion: 1,
    };
    const app = await createControlService({
      databasePath: 'unused-by-test',
      openDatabase: async () => ({ close, diagnostics: () => diagnostics }),
    });

    await app.close();

    expect(close).toHaveBeenCalledOnce();
  });

  it('fails closed when persisted migration history is invalid', async () => {
    const databasePath = await temporaryDatabasePath();
    const initializedApp = await createControlService({ databasePath });
    await initializedApp.close();

    const tamper = new DatabaseSync(databasePath);
    tamper
      .prepare('UPDATE schema_migrations SET checksum = ? WHERE id = 1')
      .run('0'.repeat(64));
    tamper.close();

    await expect(
      createControlService({
        databasePath,
      }),
    ).rejects.toThrow('Migration history does not match migration 1');
  });
});
