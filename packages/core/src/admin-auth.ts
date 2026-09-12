import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export const ADMIN_PASSWORD_MIN_LENGTH = 12;
export const ADMIN_PASSWORD_MAX_BYTES = 4_096;
export const ADMIN_SESSION_IDLE_MS = 30 * 60 * 1_000;
export const ADMIN_SESSION_ABSOLUTE_MS = 24 * 60 * 60 * 1_000;

const SCRYPT_COST = 2 ** 17;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 256 * 1_024 * 1_024;
const SCRYPT_SALT_LENGTH = 16;
const AUTH_ATTEMPT_LIMIT = 5;
const AUTH_ATTEMPT_WINDOW_MS = 60_000;
const MAX_TRACKED_ATTEMPT_KEYS = 256;
let scryptWorkActive = false;

export interface AdminPasswordVerifier {
  readonly algorithm: 'scrypt';
  readonly blockSize: number;
  readonly cost: number;
  readonly hash: string;
  readonly keyLength: number;
  readonly parallelization: number;
  readonly salt: string;
}

export type SessionAudience = 'lan' | 'loopback';

export interface AdminSessionRecord {
  readonly absoluteExpiresAt: string;
  readonly audience: SessionAudience;
  readonly createdAt: string;
  readonly idleExpiresAt: string;
  readonly lastSeenAt: string;
  readonly tokenDigest: string;
}

export interface NewAdminSession extends AdminSessionRecord {
  readonly token: string;
}

export class AdminPasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminPasswordPolicyError';
  }
}

export type AdminPasswordVerificationResult =
  'authenticated' | 'busy' | 'invalid' | 'rate_limited';

export class AdminPasswordAuthenticator {
  readonly #attempts = new Map<string, number[]>();

  async verify(
    attemptKey: string,
    password: string,
    verifier: AdminPasswordVerifier,
    now = new Date(),
  ): Promise<AdminPasswordVerificationResult> {
    const timestamp = now.getTime();
    this.#prune(timestamp);
    const key =
      this.#attempts.has(attemptKey) ||
      this.#attempts.size < MAX_TRACKED_ATTEMPT_KEYS
        ? attemptKey
        : '__overflow__';
    const attempts = this.#attempts.get(key) ?? [];
    if (attempts.length >= AUTH_ATTEMPT_LIMIT) {
      return 'rate_limited';
    }
    attempts.push(timestamp);
    this.#attempts.set(key, attempts);

    try {
      return (await verifyAdminPassword(password, verifier))
        ? 'authenticated'
        : 'invalid';
    } catch (error) {
      if (error instanceof ScryptWorkBusyError) {
        return 'busy';
      }
      throw error;
    }
  }

  #prune(now: number): void {
    const cutoff = now - AUTH_ATTEMPT_WINDOW_MS;
    for (const [key, attempts] of this.#attempts) {
      const active = attempts.filter((timestamp) => timestamp > cutoff);
      if (active.length === 0) {
        this.#attempts.delete(key);
      } else {
        this.#attempts.set(key, active);
      }
    }
  }
}

export async function createAdminPasswordVerifier(
  password: string,
): Promise<AdminPasswordVerifier> {
  validateAdminPassword(password);
  const salt = randomBytes(SCRYPT_SALT_LENGTH);
  const hash = await deriveScrypt(password, salt);
  return Object.freeze({
    algorithm: 'scrypt',
    blockSize: SCRYPT_BLOCK_SIZE,
    cost: SCRYPT_COST,
    hash: hash.toString('base64url'),
    keyLength: SCRYPT_KEY_LENGTH,
    parallelization: SCRYPT_PARALLELIZATION,
    salt: salt.toString('base64url'),
  });
}

async function verifyAdminPassword(
  password: string,
  verifier: AdminPasswordVerifier,
): Promise<boolean> {
  if (!isSupportedVerifier(verifier)) {
    return false;
  }

  const salt = Buffer.from(verifier.salt, 'base64url');
  const expected = Buffer.from(verifier.hash, 'base64url');
  if (
    salt.length !== SCRYPT_SALT_LENGTH ||
    expected.length !== SCRYPT_KEY_LENGTH ||
    Buffer.byteLength(password, 'utf8') > ADMIN_PASSWORD_MAX_BYTES
  ) {
    return false;
  }

  const actual = await deriveScrypt(password, salt);
  return timingSafeEqual(actual, expected);
}

export function createAdminSession(
  audience: SessionAudience,
  now = new Date(),
): NewAdminSession {
  const token = randomBytes(32).toString('base64url');
  const createdAt = now.toISOString();
  return Object.freeze({
    absoluteExpiresAt: new Date(
      now.getTime() + ADMIN_SESSION_ABSOLUTE_MS,
    ).toISOString(),
    audience,
    createdAt,
    idleExpiresAt: new Date(
      now.getTime() + ADMIN_SESSION_IDLE_MS,
    ).toISOString(),
    lastSeenAt: createdAt,
    token,
    tokenDigest: digestSessionToken(token),
  });
}

export function digestSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('base64url');
}

function validateAdminPassword(password: string): void {
  if ([...password].length < ADMIN_PASSWORD_MIN_LENGTH) {
    throw new AdminPasswordPolicyError(
      `Administrator password must contain at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`,
    );
  }
  if (Buffer.byteLength(password, 'utf8') > ADMIN_PASSWORD_MAX_BYTES) {
    throw new AdminPasswordPolicyError('Administrator password is too long');
  }
}

function isSupportedVerifier(verifier: AdminPasswordVerifier): boolean {
  return (
    verifier.algorithm === 'scrypt' &&
    verifier.cost === SCRYPT_COST &&
    verifier.blockSize === SCRYPT_BLOCK_SIZE &&
    verifier.parallelization === SCRYPT_PARALLELIZATION &&
    verifier.keyLength === SCRYPT_KEY_LENGTH
  );
}

function deriveScrypt(password: string, salt: Buffer): Promise<Buffer> {
  if (scryptWorkActive) {
    return Promise.reject(new ScryptWorkBusyError());
  }
  scryptWorkActive = true;
  return new Promise((resolve, reject) => {
    try {
      scrypt(
        password,
        salt,
        SCRYPT_KEY_LENGTH,
        {
          N: SCRYPT_COST,
          maxmem: SCRYPT_MAX_MEMORY,
          p: SCRYPT_PARALLELIZATION,
          r: SCRYPT_BLOCK_SIZE,
        },
        (error, derivedKey) => {
          scryptWorkActive = false;
          if (error !== null) {
            reject(error);
            return;
          }
          resolve(derivedKey);
        },
      );
    } catch (error) {
      scryptWorkActive = false;
      reject(error);
    }
  });
}

class ScryptWorkBusyError extends Error {}
