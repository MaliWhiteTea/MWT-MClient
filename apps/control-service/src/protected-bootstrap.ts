import type { Stats } from 'node:fs';
import { lstat, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import {
  BOOTSTRAP_PROOF_LIFETIME_MS,
  type BootstrapProofRecord,
} from '@mwt-mclient/core';

import type {
  BootstrapProofProvider,
  ProtectedPathSecurityValidator,
} from './runtime.js';
import type { ConsumableBootstrapProof } from './app.js';

const BOOTSTRAP_RECORD_FILE = 'bootstrap-proof.json';
const MAX_BOOTSTRAP_RECORD_BYTES = 1_024;

export class ProtectedFileBootstrapProofProvider implements BootstrapProofProvider {
  readonly #dataDirectory: string;
  readonly #pathSecurityValidator: ProtectedPathSecurityValidator;

  constructor(
    dataDirectory: string,
    pathSecurityValidator: ProtectedPathSecurityValidator,
  ) {
    this.#dataDirectory = dataDirectory;
    this.#pathSecurityValidator = pathSecurityValidator;
  }

  async load(): Promise<ConsumableBootstrapProof | null> {
    const path = join(this.#dataDirectory, BOOTSTRAP_RECORD_FILE);
    let stats;
    try {
      stats = await lstat(path);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return null;
      throw new Error('Could not inspect the protected bootstrap record', {
        cause: error,
      });
    }
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new Error('Protected bootstrap record must be a regular file');
    }
    if (stats.size > MAX_BOOTSTRAP_RECORD_BYTES) {
      throw new Error('Protected bootstrap record exceeds its size limit');
    }

    await this.#pathSecurityValidator.assertSecure(path);
    const handle = await open(path, 'r');
    try {
      const openedStats = await handle.stat();
      if (
        !openedStats.isFile() ||
        openedStats.size > MAX_BOOTSTRAP_RECORD_BYTES
      ) {
        throw new Error('Protected bootstrap record changed during validation');
      }
      const content = Buffer.alloc(MAX_BOOTSTRAP_RECORD_BYTES + 1);
      const { bytesRead } = await handle.read(content, 0, content.length, 0);
      if (bytesRead > MAX_BOOTSTRAP_RECORD_BYTES) {
        throw new Error('Protected bootstrap record exceeds its size limit');
      }
      const text = content.subarray(0, bytesRead).toString('utf8');
      const record = parseBootstrapProofRecord(text);
      if (record === null) return null;
      return createConsumableProof(
        path,
        openedStats,
        record,
        this.#pathSecurityValidator,
      );
    } finally {
      await handle.close();
    }
  }
}

function createConsumableProof(
  path: string,
  loadedStats: Stats,
  record: BootstrapProofRecord,
  pathSecurityValidator: ProtectedPathSecurityValidator,
): ConsumableBootstrapProof {
  let available = true;
  return Object.freeze({
    consume: async () => {
      if (!available) return false;
      available = false;
      let currentStats;
      try {
        currentStats = await lstat(path);
      } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') return false;
        throw new Error('Could not consume the protected bootstrap record', {
          cause: error,
        });
      }
      if (
        currentStats.isSymbolicLink() ||
        !currentStats.isFile() ||
        !sameFile(currentStats, loadedStats)
      ) {
        return false;
      }
      await pathSecurityValidator.assertSecure(path);
      try {
        await unlink(path);
        return true;
      } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') return false;
        throw new Error('Could not consume the protected bootstrap record', {
          cause: error,
        });
      }
    },
    record,
  });
}

function sameFile(left: Stats, right: Stats): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs
  );
}

export function parseBootstrapProofRecord(
  text: string,
  now = new Date(),
): BootstrapProofRecord | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Protected bootstrap record is not valid JSON');
  }
  if (!isObject(value)) {
    throw new Error('Protected bootstrap record has an invalid shape');
  }
  const keys = Object.keys(value).sort();
  if (
    keys.length !== 2 ||
    keys[0] !== 'digest' ||
    keys[1] !== 'expiresAt' ||
    typeof value.digest !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(value.digest) ||
    typeof value.expiresAt !== 'string'
  ) {
    throw new Error('Protected bootstrap record has an invalid shape');
  }

  const expiresAt = Date.parse(value.expiresAt);
  if (
    !Number.isFinite(expiresAt) ||
    new Date(expiresAt).toISOString() !== value.expiresAt
  ) {
    throw new Error('Protected bootstrap record has an invalid expiry');
  }
  if (expiresAt <= now.getTime()) return null;
  if (expiresAt - now.getTime() > BOOTSTRAP_PROOF_LIFETIME_MS) {
    throw new Error('Protected bootstrap record expiry exceeds its limit');
  }
  return Object.freeze({ digest: value.digest, expiresAt: value.expiresAt });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
