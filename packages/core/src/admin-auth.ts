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
export const BOOTSTRAP_PROOF_LIFETIME_MS = 10 * 60 * 1_000;
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
  'authenticated' | 'busy' | 'invalid';

export class AdminPasswordAuthenticator {
  async verify(
    password: string,
    verifier: AdminPasswordVerifier,
  ): Promise<AdminPasswordVerificationResult> {
    try {
      return (await verifyAdminPassword(password, verifier))
        ? 'authenticated'
        : 'invalid';
    } catch (error) {
      if (error instanceof AdminPasswordWorkBusyError) {
        return 'busy';
      }
      throw error;
    }
  }
}

export interface BootstrapProofRecord {
  readonly digest: string;
  readonly expiresAt: string;
}

export interface NewBootstrapProof extends BootstrapProofRecord {
  readonly proof: string;
}

export function createBootstrapProof(now = new Date()): NewBootstrapProof {
  const proof = randomBytes(32).toString('base64url');
  return Object.freeze({
    digest: digestOpaqueToken(proof),
    expiresAt: new Date(
      now.getTime() + BOOTSTRAP_PROOF_LIFETIME_MS,
    ).toISOString(),
    proof,
  });
}

export function verifyBootstrapProof(
  proof: string,
  record: BootstrapProofRecord,
  now = new Date(),
): boolean {
  if (now.getTime() >= Date.parse(record.expiresAt)) return false;
  const actual = Buffer.from(digestOpaqueToken(proof), 'base64url');
  const expected = Buffer.from(record.digest, 'base64url');
  return (
    actual.length === 32 &&
    expected.length === 32 &&
    timingSafeEqual(actual, expected)
  );
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
  return digestOpaqueToken(token);
}

function digestOpaqueToken(token: string): string {
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
    return Promise.reject(new AdminPasswordWorkBusyError());
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

export class AdminPasswordWorkBusyError extends Error {
  constructor() {
    super('Administrator password work capacity is busy');
    this.name = 'AdminPasswordWorkBusyError';
  }
}
