import { randomUUID } from 'node:crypto';
import { lstat, open, unlink, type FileHandle } from 'node:fs/promises';
import { join } from 'node:path';

import type { ProtectedPathSecurityValidator } from './runtime.js';

export type PosixPathKind = 'directory' | 'file';

export interface PosixPathMetadata {
  readonly kind: PosixPathKind;
  readonly mode: number;
  readonly uid: number;
}

export class PosixPathSecurityValidator implements ProtectedPathSecurityValidator {
  readonly #expectedUid: number;

  constructor(expectedUid = currentUid()) {
    validateExpectedUid(expectedUid);
    this.#expectedUid = expectedUid;
  }

  async assertSecure(path: string): Promise<void> {
    if (process.platform === 'win32') {
      throw new Error(
        'POSIX path security validation is unavailable on Windows',
      );
    }
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      throw new Error('Protected path must not be a symbolic link');
    }
    const kind = stats.isDirectory()
      ? 'directory'
      : stats.isFile()
        ? 'file'
        : null;
    if (kind === null) {
      throw new Error('Protected path must be a directory or regular file');
    }
    assertSecurePosixPathMetadata(
      { kind, mode: stats.mode, uid: stats.uid },
      this.#expectedUid,
    );
    await probeCurrentProcessAccess(path, kind);
  }
}

export function assertSecurePosixPathMetadata(
  metadata: PosixPathMetadata,
  expectedUid: number,
): void {
  validateExpectedUid(expectedUid);
  if (metadata.uid !== expectedUid) {
    throw new Error('Protected path owner does not match the service user');
  }
  const permissions = metadata.mode & 0o777;
  const required = metadata.kind === 'directory' ? 0o700 : 0o600;
  if (permissions !== required) {
    throw new Error(
      `Protected ${metadata.kind} permissions must be ${required.toString(8)}`,
    );
  }
}

function validateExpectedUid(expectedUid: number): void {
  if (!Number.isSafeInteger(expectedUid) || expectedUid <= 0) {
    throw new TypeError('expectedUid must identify a non-root service user');
  }
}

function currentUid(): number {
  if (process.platform === 'win32' || process.getuid === undefined) {
    throw new Error('A POSIX user identity is required');
  }
  return process.getuid();
}

async function probeCurrentProcessAccess(
  path: string,
  kind: PosixPathKind,
): Promise<void> {
  if (kind === 'file') {
    const handle = await open(path, 'r+');
    await handle.close();
    return;
  }

  const probePath = join(path, `.mwt-access-probe-${randomUUID()}`);
  let handle: FileHandle | undefined;
  let failure: unknown;
  try {
    handle = await open(probePath, 'wx', 0o600);
    await handle.writeFile('mwt');
    const content = Buffer.alloc(3);
    const { bytesRead } = await handle.read(content, 0, content.length, 0);
    if (bytesRead !== 3 || content.toString('utf8') !== 'mwt') {
      throw new Error('Protected directory probe failed');
    }
  } catch (error) {
    failure = error;
  }
  try {
    await handle?.close();
  } catch (error) {
    failure ??= error;
  }
  if (handle !== undefined) {
    try {
      await unlink(probePath);
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure !== undefined) {
    throw new Error('Protected directory access probe failed', {
      cause: failure,
    });
  }
}
