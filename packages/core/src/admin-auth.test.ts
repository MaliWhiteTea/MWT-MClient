import { describe, expect, it } from 'vitest';

import {
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  AdminPasswordAuthenticator,
  AdminPasswordPolicyError,
  createAdminPasswordVerifier,
  createAdminSession,
  createBootstrapProof,
  digestSessionToken,
  verifyBootstrapProof,
} from './admin-auth.js';

describe('administrator authentication', () => {
  it('creates a salted scrypt verifier and compares passwords safely', async () => {
    const first = await createAdminPasswordVerifier('correct horse battery');
    const second = await createAdminPasswordVerifier('correct horse battery');

    expect(first.algorithm).toBe('scrypt');
    expect(first.cost).toBe(2 ** 17);
    expect(first.salt).not.toBe(second.salt);
    const authenticator = new AdminPasswordAuthenticator();
    await expect(
      authenticator.verify('correct horse battery', first),
    ).resolves.toBe('authenticated');
    await expect(authenticator.verify('wrong password', first)).resolves.toBe(
      'invalid',
    );
    expect(JSON.stringify(first)).not.toContain('correct horse battery');
  });

  it('limits concurrent scrypt work without a shared lockout', async () => {
    const verifier = await createAdminPasswordVerifier('correct horse battery');
    const authenticator = new AdminPasswordAuthenticator();
    const [first, concurrent] = await Promise.all([
      authenticator.verify('wrong password', verifier),
      authenticator.verify('wrong password', verifier),
    ]);

    expect(first).toBe('invalid');
    expect(concurrent).toBe('busy');
    await expect(
      authenticator.verify('correct horse battery', verifier),
    ).resolves.toBe('authenticated');
  });

  it('creates short-lived bootstrap ownership proofs', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const proof = createBootstrapProof(now);
    expect(proof.proof).toHaveLength(43);
    expect(proof.digest).not.toBe(proof.proof);
    expect(verifyBootstrapProof(proof.proof, proof, now)).toBe(true);
    expect(verifyBootstrapProof('x'.repeat(43), proof, now)).toBe(false);
    expect(
      verifyBootstrapProof(
        proof.proof,
        proof,
        new Date(now.getTime() + 10 * 60_000),
      ),
    ).toBe(false);
  });

  it('rejects passwords shorter than twelve characters', async () => {
    await expect(createAdminPasswordVerifier('short')).rejects.toBeInstanceOf(
      AdminPasswordPolicyError,
    );
  });

  it('creates opaque sessions with idle and absolute expiration', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const session = createAdminSession('loopback', now);

    expect(session.token).toHaveLength(43);
    expect(session.tokenDigest).toBe(digestSessionToken(session.token));
    expect(session.tokenDigest).not.toBe(session.token);
    expect(Date.parse(session.idleExpiresAt) - now.getTime()).toBe(
      ADMIN_SESSION_IDLE_MS,
    );
    expect(Date.parse(session.absoluteExpiresAt) - now.getTime()).toBe(
      ADMIN_SESSION_ABSOLUTE_MS,
    );
  });
});
