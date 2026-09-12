import { createServer } from 'node:net';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createBootstrapProof } from '@mwt-mclient/core';

import { startLoopbackControlService, type LoopbackHost } from './runtime.js';

const temporaryDirectories: string[] = [];
const closeRuntime: Array<() => Promise<void>> = [];
const securePath = { assertSecure: async () => undefined };

afterEach(async () => {
  await Promise.all(closeRuntime.splice(0).map((close) => close()));
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  );
});

async function temporaryDataDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mwt-runtime-'));
  temporaryDirectories.push(directory);
  if (process.platform !== 'win32') await chmod(directory, 0o700);
  return directory;
}

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    server.close();
    throw new Error('Could not reserve a test port');
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
  return address.port;
}

describe('loopback control service runtime', () => {
  it('opens the migrated service on the selected IPv4 loopback origin', async () => {
    const bootstrap = createBootstrapProof();
    const port = await availablePort();
    const runtime = await startLoopbackControlService({
      bootstrapProofProvider: {
        load: async () => ({
          consume: async () => true,
          record: {
            digest: bootstrap.digest,
            expiresAt: bootstrap.expiresAt,
          },
        }),
      },
      dataDirectory: await temporaryDataDirectory(),
      pathSecurityValidator: securePath,
      host: '127.0.0.1',
      port,
    });
    closeRuntime.push(() => runtime.close());

    const response = await fetch(`${runtime.origin}/api/v1/system/status`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      databaseReady: true,
      product: 'MWT-MClient',
      setupPhase: 'bootstrap',
    });
    expect(runtime).toMatchObject({ host: '127.0.0.1', port });
  });

  it('starts without a bootstrap credential while keeping setup unavailable', async () => {
    const runtime = await startLoopbackControlService({
      bootstrapProofProvider: { load: async () => null },
      dataDirectory: await temporaryDataDirectory(),
      pathSecurityValidator: securePath,
      host: '127.0.0.1',
      port: await availablePort(),
    });
    closeRuntime.push(() => runtime.close());

    const response = await fetch(`${runtime.origin}/api/v1/system/status`);

    expect(response.status).toBe(200);
  });

  it('rejects invalid ports and non-directory data paths before startup', async () => {
    const directory = await temporaryDataDirectory();
    const file = join(directory, 'not-a-directory');
    await writeFile(file, 'not secret');
    const provider = { load: async () => null };

    await expect(
      startLoopbackControlService({
        bootstrapProofProvider: provider,
        dataDirectory: directory,
        pathSecurityValidator: securePath,
        host: '127.0.0.1',
        port: 0,
      }),
    ).rejects.toThrow('port must be an integer between 1 and 65535');
    await expect(
      startLoopbackControlService({
        bootstrapProofProvider: provider,
        dataDirectory: file,
        pathSecurityValidator: securePath,
        host: '127.0.0.1',
        port: await availablePort(),
      }),
    ).rejects.toThrow('dataDirectory must be an existing real directory');
  });

  it('rejects a wildcard bind address at runtime', async () => {
    await expect(
      startLoopbackControlService({
        bootstrapProofProvider: { load: async () => null },
        dataDirectory: await temporaryDataDirectory(),
        pathSecurityValidator: securePath,
        host: '0.0.0.0' as LoopbackHost,
        port: await availablePort(),
      }),
    ).rejects.toThrow('host must be an explicit IPv4 or IPv6 loopback address');
  });

  it('stops accepting requests after controlled shutdown', async () => {
    const runtime = await startLoopbackControlService({
      bootstrapProofProvider: { load: async () => null },
      dataDirectory: await temporaryDataDirectory(),
      pathSecurityValidator: securePath,
      host: '127.0.0.1',
      port: await availablePort(),
    });

    await runtime.close();

    await expect(
      fetch(`${runtime.origin}/api/v1/system/status`),
    ).rejects.toThrow();
  });
});
