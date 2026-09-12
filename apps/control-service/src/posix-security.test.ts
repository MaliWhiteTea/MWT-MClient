import { describe, expect, it } from 'vitest';

import {
  assertSecurePosixPathMetadata,
  PosixPathSecurityValidator,
} from './posix-security.js';

describe('POSIX protected path policy', () => {
  it('accepts only service-owned 0700 directories and 0600 files', () => {
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'directory', mode: 0o40700, uid: 1200 },
        1200,
      ),
    ).not.toThrow();
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'file', mode: 0o100600, uid: 1200 },
        1200,
      ),
    ).not.toThrow();
  });

  it('rejects another owner and any group or other access', () => {
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'directory', mode: 0o40700, uid: 1300 },
        1200,
      ),
    ).toThrow('owner does not match');
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'directory', mode: 0o40750, uid: 1200 },
        1200,
      ),
    ).toThrow('permissions must be 700');
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'file', mode: 0o100604, uid: 1200 },
        1200,
      ),
    ).toThrow('permissions must be 600');
  });

  it('rejects root as the service owner', () => {
    expect(() => new PosixPathSecurityValidator(0)).toThrow(
      'non-root service user',
    );
    expect(() =>
      assertSecurePosixPathMetadata(
        { kind: 'directory', mode: 0o40700, uid: 0 },
        0,
      ),
    ).toThrow('non-root service user');
  });
});
