import { describe, expect, it, vi } from 'vitest';

import {
  assertSecureWindowsAcl,
  parseWindowsAclInspection,
  WindowsAclHelperProcess,
  type WindowsAclInspection,
} from './windows-security.js';

const SERVICE_SID = 'S-1-5-21-100-200-300-1001';
const SYSTEM_SID = 'S-1-5-18';
const ADMINISTRATORS_SID = 'S-1-5-32-544';
const USERS_SID = 'S-1-5-32-545';

function secureDirectoryInspection(): WindowsAclInspection {
  return {
    aclProtected: true,
    currentProcessAccess: {
      canDelete: true,
      canRead: true,
      canWrite: true,
    },
    kind: 'directory',
    ownerSid: SYSTEM_SID,
    processSid: SERVICE_SID,
    protocolVersion: 1,
    rules: [
      {
        accessMask: 0x1f_01ff,
        inheritanceFlags: 3,
        inherited: false,
        inheritOnly: false,
        noPropagate: false,
        sid: SYSTEM_SID,
        type: 'allow',
      },
      {
        accessMask: 0x1f_01ff,
        inheritanceFlags: 3,
        inherited: false,
        inheritOnly: false,
        noPropagate: false,
        sid: ADMINISTRATORS_SID,
        type: 'allow',
      },
      {
        accessMask: 0x3_01bf,
        inheritanceFlags: 3,
        inherited: false,
        inheritOnly: false,
        noPropagate: false,
        sid: SERVICE_SID,
        type: 'allow',
      },
    ],
  };
}

describe('Windows protected path policy', () => {
  it('accepts a protected ACL limited to the service and trusted owners', () => {
    expect(() =>
      assertSecureWindowsAcl(
        secureDirectoryInspection(),
        SERVICE_SID,
        'directory',
      ),
    ).not.toThrow();
  });

  it('rejects inherited directory ACLs and grants to another SID', () => {
    expect(() =>
      assertSecureWindowsAcl(
        { ...secureDirectoryInspection(), aclProtected: false },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('disable ACL inheritance');
    expect(() =>
      assertSecureWindowsAcl(
        {
          ...secureDirectoryInspection(),
          rules: [
            ...secureDirectoryInspection().rules,
            {
              accessMask: 1,
              inheritanceFlags: 0,
              inherited: false,
              inheritOnly: false,
              noPropagate: false,
              sid: USERS_SID,
              type: 'allow',
            },
          ],
        },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('grants access to another SID');
  });

  it('rejects the wrong process identity and insufficient effective access', () => {
    expect(() =>
      assertSecureWindowsAcl(
        { ...secureDirectoryInspection(), processSid: USERS_SID },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('not running as the service user');
    expect(() =>
      assertSecureWindowsAcl(
        {
          ...secureDirectoryInspection(),
          currentProcessAccess: {
            canDelete: false,
            canRead: true,
            canWrite: true,
          },
        },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('lacks effective path access');
  });

  it('requires complete service permissions for both child kinds', () => {
    const inspection = secureDirectoryInspection();
    expect(() =>
      assertSecureWindowsAcl(
        {
          ...inspection,
          rules: [
            ...inspection.rules.slice(0, 2),
            {
              accessMask: 0x3_01bf,
              inheritanceFlags: 0,
              inherited: false,
              inheritOnly: false,
              noPropagate: false,
              sid: SERVICE_SID,
              type: 'allow',
            },
            {
              accessMask: 0,
              inheritanceFlags: 3,
              inherited: false,
              inheritOnly: true,
              noPropagate: false,
              sid: SERVICE_SID,
              type: 'allow',
            },
          ],
        },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('must fully inherit');

    expect(() =>
      assertSecureWindowsAcl(
        {
          ...inspection,
          rules: inspection.rules.map((rule) =>
            rule.sid === SERVICE_SID ? { ...rule, noPropagate: true } : rule,
          ),
        },
        SERVICE_SID,
        'directory',
      ),
    ).toThrow('must fully inherit');
  });

  it('strictly parses helper output and rejects unknown fields', () => {
    expect(parseWindowsAclInspection(secureDirectoryInspection())).toEqual(
      secureDirectoryInspection(),
    );
    expect(() =>
      parseWindowsAclInspection({
        ...secureDirectoryInspection(),
        debugPath: 'must not be accepted',
      }),
    ).toThrow('invalid shape');
    expect(() =>
      parseWindowsAclInspection({
        ...secureDirectoryInspection(),
        rules: [
          {
            ...secureDirectoryInspection().rules[0]!,
            type: 'audit',
          },
        ],
      }),
    ).toThrow('rule has an invalid shape');
  });

  it.runIf(process.platform === 'win32')(
    'uses a versioned JSON stdin/stdout helper contract',
    async () => {
      const execute = vi.fn(async () =>
        JSON.stringify(secureDirectoryInspection()),
      );
      const verifyExecutable = vi.fn(async () => undefined);
      const helper = new WindowsAclHelperProcess(execute, verifyExecutable);

      await expect(
        helper.inspect({
          expectedKind: 'directory',
          path: 'C:\\ProgramData\\MWT-MClient',
          protocolVersion: 1,
        }),
      ).resolves.toEqual(secureDirectoryInspection());
      expect(verifyExecutable).toHaveBeenCalledOnce();
      const helperPath = verifyExecutable.mock.calls[0]![0];
      expect(helperPath).toMatch(
        /[\\/]native[\\/]win-x64[\\/]mwt-acl-helper\.exe$/,
      );
      expect(execute).toHaveBeenCalledWith(
        helperPath,
        JSON.stringify({
          expectedKind: 'directory',
          path: 'C:\\ProgramData\\MWT-MClient',
          protocolVersion: 1,
        }),
      );
    },
  );
});
