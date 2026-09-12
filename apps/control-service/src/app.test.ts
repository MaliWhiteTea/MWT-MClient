import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBootstrapProof } from '@mwt-mclient/core';
import type { DatabaseDiagnostics } from '@mwt-mclient/database';
import type { FastifyInstance } from 'fastify';

import { createControlService } from './app.js';

const loopbackOrigins = ['http://localhost'];
const bootstrap = createBootstrapProof();
const bootstrapProof = {
  consume: async () => true,
  record: {
    digest: bootstrap.digest,
    expiresAt: bootstrap.expiresAt,
  },
};
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
      bootstrapProof,
      databasePath: await temporaryDatabasePath(),
      loopbackOrigins,
    });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      databaseReady: true,
      databaseSchemaVersion: 2,
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
      schemaVersion: 2,
    };
    const app = await createControlService({
      bootstrapProof,
      databasePath: 'unused-by-test',
      loopbackOrigins,
      openDatabase: async () => ({
        close,
        createAdministrator: vi.fn(),
        createAdminSession: vi.fn(),
        diagnostics: () => diagnostics,
        getAdministrator: () => null,
        hasAdministrator: () => false,
        resumeAdminSession: () => null,
        revokeAdminSession: () => false,
      }),
    });

    await app.close();

    expect(close).toHaveBeenCalledOnce();
  });

  it('fails closed when persisted migration history is invalid', async () => {
    const databasePath = await temporaryDatabasePath();
    const initializedApp = await createControlService({
      bootstrapProof,
      databasePath,
      loopbackOrigins,
    });
    await initializedApp.close();

    const tamper = new DatabaseSync(databasePath);
    tamper
      .prepare('UPDATE schema_migrations SET checksum = ? WHERE id = 1')
      .run('0'.repeat(64));
    tamper.close();

    await expect(
      createControlService({
        bootstrapProof,
        databasePath,
        loopbackOrigins,
      }),
    ).rejects.toThrow('Migration history does not match migration 1');
  });

  it('creates one administrator only from an allowed loopback origin', async () => {
    const consume = vi.fn(async () => true);
    const app = await createControlService({
      bootstrapProof: { consume, record: bootstrapProof.record },
      databasePath: await temporaryDatabasePath(),
      loopbackOrigins,
    });
    apps.push(app);
    const body = {
      bootstrapProof: bootstrap.proof,
      displayName: 'Yönetici',
      password: 'correct horse battery',
    };

    const missingOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      payload: body,
    });
    expect(missingOrigin.statusCode).toBe(403);

    const invalidProof = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: { ...body, bootstrapProof: 'x'.repeat(43) },
    });
    expect(invalidProof.statusCode).toBe(403);

    const blankName = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: { ...body, displayName: '   ' },
    });
    expect(blankName.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: body,
    });
    expect(created.statusCode).toBe(201);
    expect(consume).toHaveBeenCalledOnce();
    const cookie = created.headers['set-cookie'];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: body,
    });
    expect(duplicate.statusCode).toBe(409);

    const authenticated = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/session',
      headers: { cookie: Array.isArray(cookie) ? cookie[0] : cookie },
    });
    expect(authenticated.statusCode).toBe(200);
    expect(authenticated.json()).toEqual({
      authenticated: true,
      displayName: 'Yönetici',
    });

    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
    });
    expect(status.json()).toMatchObject({ setupPhase: 'local_only' });
  });

  it('keeps setup unavailable when no protected bootstrap proof is loaded', async () => {
    const app = await createControlService({
      bootstrapProof: null,
      databasePath: await temporaryDatabasePath(),
      loopbackOrigins,
    });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: {
        bootstrapProof: bootstrap.proof,
        displayName: 'Yönetici',
        password: 'correct horse battery',
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      code: 'bootstrap_proof_unavailable',
      messageKey: 'api.error.bootstrap_proof_unavailable',
    });
  });

  it('fails closed when the persistent bootstrap proof cannot be consumed', async () => {
    const consume = vi.fn(async () => false);
    const app = await createControlService({
      bootstrapProof: { consume, record: bootstrapProof.record },
      databasePath: await temporaryDatabasePath(),
      loopbackOrigins,
    });
    apps.push(app);
    const request = {
      method: 'POST' as const,
      url: '/api/v1/setup/admin',
      headers: { origin: 'http://localhost' },
      payload: {
        bootstrapProof: bootstrap.proof,
        displayName: 'Yönetici',
        password: 'correct horse battery',
      },
    };

    const first = await app.inject(request);
    const retry = await app.inject(request);

    expect(first.statusCode).toBe(403);
    expect(retry.statusCode).toBe(403);
    expect(consume).toHaveBeenCalledOnce();
    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
    });
    expect(status.json()).toMatchObject({ setupPhase: 'bootstrap' });
  });

  it('rejects non-loopback clients and unapproved hosts', async () => {
    const app = await createControlService({
      bootstrapProof,
      databasePath: await temporaryDatabasePath(),
      loopbackOrigins,
    });
    apps.push(app);

    const remote = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
      remoteAddress: '192.168.1.10',
    });
    expect(remote.statusCode).toBe(403);
    const wrongHost = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
      headers: { host: 'evil.example' },
    });
    expect(wrongHost.statusCode).toBe(403);
  });
});
