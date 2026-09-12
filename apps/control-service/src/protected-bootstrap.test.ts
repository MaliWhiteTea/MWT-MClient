import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBootstrapProof } from '@mwt-mclient/core';

import {
  parseBootstrapProofRecord,
  ProtectedFileBootstrapProofProvider,
} from './protected-bootstrap.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  );
});

async function temporaryDirectory(): Promise<string> {
  const path = join(tmpdir(), `mwt-bootstrap-${randomUUID()}`);
  await mkdir(path);
  temporaryDirectories.push(path);
  return path;
}

describe('protected bootstrap proof provider', () => {
  it('loads only the digest and expiry from a protected record', async () => {
    const directory = await temporaryDirectory();
    const bootstrap = createBootstrapProof();
    const assertSecure = vi.fn(async () => undefined);
    await writeFile(
      join(directory, 'bootstrap-proof.json'),
      JSON.stringify({
        digest: bootstrap.digest,
        expiresAt: bootstrap.expiresAt,
      }),
    );
    const provider = new ProtectedFileBootstrapProofProvider(directory, {
      assertSecure,
    });

    const loaded = await provider.load();

    expect(loaded?.record).toEqual({
      digest: bootstrap.digest,
      expiresAt: bootstrap.expiresAt,
    });
    expect(assertSecure).toHaveBeenCalledOnce();
    await expect(loaded?.consume()).resolves.toBe(true);
    await expect(loaded?.consume()).resolves.toBe(false);
    await expect(provider.load()).resolves.toBeNull();
  });

  it('returns null when the record is absent or expired', async () => {
    const directory = await temporaryDirectory();
    const provider = new ProtectedFileBootstrapProofProvider(directory, {
      assertSecure: async () => undefined,
    });
    const now = new Date('2026-01-01T00:10:00.000Z');
    const expired = createBootstrapProof(new Date('2026-01-01T00:00:00.000Z'));

    await expect(provider.load()).resolves.toBeNull();
    expect(
      parseBootstrapProofRecord(
        JSON.stringify({
          digest: expired.digest,
          expiresAt: expired.expiresAt,
        }),
        now,
      ),
    ).toBeNull();
  });

  it('rejects extra fields, malformed digests and excessive lifetimes', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const validExpiry = new Date(now.getTime() + 5 * 60 * 1_000).toISOString();
    const digest = 'a'.repeat(43);

    expect(() =>
      parseBootstrapProofRecord(
        JSON.stringify({ digest, expiresAt: validExpiry, proof: 'secret' }),
        now,
      ),
    ).toThrow('invalid shape');
    expect(() =>
      parseBootstrapProofRecord(
        JSON.stringify({ digest: 'invalid', expiresAt: validExpiry }),
        now,
      ),
    ).toThrow('invalid shape');
    expect(() =>
      parseBootstrapProofRecord(
        JSON.stringify({
          digest,
          expiresAt: new Date(now.getTime() + 11 * 60 * 1_000).toISOString(),
        }),
        now,
      ),
    ).toThrow('expiry exceeds its limit');
  });

  it('rejects oversized records before reading their contents', async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, 'bootstrap-proof.json'), 'x'.repeat(1_025));
    const provider = new ProtectedFileBootstrapProofProvider(directory, {
      assertSecure: async () => undefined,
    });

    await expect(provider.load()).rejects.toThrow('exceeds its size limit');
  });

  it('refuses consumption if the protected record changed after loading', async () => {
    const directory = await temporaryDirectory();
    const path = join(directory, 'bootstrap-proof.json');
    const bootstrap = createBootstrapProof();
    await writeFile(
      path,
      JSON.stringify({
        digest: bootstrap.digest,
        expiresAt: bootstrap.expiresAt,
      }),
    );
    const provider = new ProtectedFileBootstrapProofProvider(directory, {
      assertSecure: async () => undefined,
    });
    const loaded = await provider.load();
    await writeFile(path, `${' '.repeat(20)}changed`);

    await expect(loaded?.consume()).resolves.toBe(false);
  });
});
