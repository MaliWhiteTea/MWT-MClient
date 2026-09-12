import { lstat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { createControlService, type ConsumableBootstrapProof } from './app.js';

export type LoopbackHost = '127.0.0.1' | '::1';

export interface BootstrapProofProvider {
  load(): Promise<ConsumableBootstrapProof | null>;
}

export interface ProtectedPathSecurityValidator {
  assertSecure(path: string): Promise<void>;
}

export interface LoopbackControlServiceOptions {
  readonly bootstrapProofProvider: BootstrapProofProvider;
  readonly dataDirectory: string;
  readonly pathSecurityValidator: ProtectedPathSecurityValidator;
  readonly host: LoopbackHost;
  readonly port: number;
}

export interface LoopbackControlServiceRuntime {
  readonly host: LoopbackHost;
  readonly origin: string;
  readonly port: number;
  close(): Promise<void>;
}

export async function startLoopbackControlService(
  options: LoopbackControlServiceOptions,
): Promise<LoopbackControlServiceRuntime> {
  validateHost(options.host);
  validatePort(options.port);
  const dataDirectory = await validateDataDirectory(options.dataDirectory);
  await options.pathSecurityValidator.assertSecure(dataDirectory);
  const origin = createLoopbackOrigin(options.host, options.port);
  const bootstrapProof = await options.bootstrapProofProvider.load();
  const app = await createControlService({
    bootstrapProof,
    databasePath: join(dataDirectory, 'mwt-mclient.sqlite'),
    loopbackOrigins: [origin],
  });

  try {
    await app.listen({ host: options.host, port: options.port });
  } catch (error) {
    await app.close();
    throw error;
  }

  return Object.freeze({
    close: async () => app.close(),
    host: options.host,
    origin,
    port: options.port,
  });
}

function validateHost(host: string): asserts host is LoopbackHost {
  if (host !== '127.0.0.1' && host !== '::1') {
    throw new TypeError(
      'host must be an explicit IPv4 or IPv6 loopback address',
    );
  }
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new TypeError('port must be an integer between 1 and 65535');
  }
}

async function validateDataDirectory(path: string): Promise<string> {
  const requestedPath = resolve(path);
  const stats = await lstat(requestedPath);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new TypeError('dataDirectory must be an existing real directory');
  }

  const canonicalPath = await realpath(requestedPath);
  if (process.platform !== 'win32' && (stats.mode & 0o077) !== 0) {
    throw new TypeError(
      'dataDirectory must not be accessible by group or other',
    );
  }
  return canonicalPath;
}

function createLoopbackOrigin(host: LoopbackHost, port: number): string {
  const urlHost = host === '::1' ? '[::1]' : host;
  return new URL(`http://${urlHost}:${port}`).origin;
}
