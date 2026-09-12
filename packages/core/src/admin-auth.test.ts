import { describe, expect, it } from 'vitest';

import {
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  AdminPasswordAuthenticator,
  AdminPasswordPolicyError,
  createAdminPasswordVerifier,
  createAdminSession,
  digestSessionToken,
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
      authenticator.verify('loopback', 'correct horse battery', first),
    ).resolves.toBe('authenticated');
    await expect(
      authenticator.verify('loopback', 'wrong password', first),
    ).resolves.toBe('invalid');
    expect(JSON.stringify(first)).not.toContain('correct horse battery');
  });

  it('limits both verification rate and concurrent scrypt work', async () => {
    const verifier = await createAdminPasswordVerifier('correct horse battery');
    const authenticator = new AdminPasswordAuthenticator();
    const [first, concurrent] = await Promise.all([
      authenticator.verify('client-a', 'wrong password', verifier),
      authenticator.verify('client-b', 'wrong password', verifier),
    ]);

    expect(first).toBe('invalid');
    expect(concurrent).toBe('busy');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await authenticator.verify('limited-client', 'wrong password', verifier);
    }
    await expect(
      authenticator.verify('limited-client', 'wrong password', verifier),
    ).resolves.toBe('rate_limited');
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
