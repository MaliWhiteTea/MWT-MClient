import { spawn } from 'node:child_process';
import { lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { ProtectedPathSecurityValidator } from './runtime.js';

export const WINDOWS_ACL_HELPER_PROTOCOL_VERSION = 1;

const LOCAL_SYSTEM_SID = 'S-1-5-18';
const BUILTIN_ADMINISTRATORS_SID = 'S-1-5-32-544';
const REQUIRED_MODIFY_MASK = 0x0003_01bf;
const MAX_INHERITANCE_FLAGS = 0x3;
const MAX_HELPER_OUTPUT_BYTES = 64 * 1_024;
const HELPER_TIMEOUT_MS = 5_000;
const PACKAGED_HELPER_PATH = fileURLToPath(
  new URL('./native/win-x64/mwt-acl-helper.exe', import.meta.url),
);

export type WindowsProtectedPathKind = 'directory' | 'file';

export interface WindowsAclInspectionRequest {
  readonly expectedKind: WindowsProtectedPathKind;
  readonly path: string;
  readonly protocolVersion: 1;
}

export interface WindowsAclRule {
  readonly accessMask: number;
  readonly inheritanceFlags: number;
  readonly inherited: boolean;
  readonly inheritOnly: boolean;
  readonly noPropagate: boolean;
  readonly sid: string;
  readonly type: 'allow' | 'deny';
}

export interface WindowsAclInspection {
  readonly aclProtected: boolean;
  readonly currentProcessAccess: {
    readonly canDelete: boolean;
    readonly canRead: boolean;
    readonly canWrite: boolean;
  };
  readonly kind: WindowsProtectedPathKind;
  readonly ownerSid: string;
  readonly processSid: string;
  readonly protocolVersion: 1;
  readonly rules: readonly WindowsAclRule[];
}

export interface WindowsAclHelper {
  inspect(request: WindowsAclInspectionRequest): Promise<unknown>;
}

type HelperExecutor = (
  executablePath: string,
  input: string,
) => Promise<string>;
type HelperExecutableVerifier = (executablePath: string) => Promise<void>;

export class WindowsAclHelperProcess implements WindowsAclHelper {
  readonly #executablePath: string;
  readonly #execute: HelperExecutor;
  readonly #verifyExecutable: HelperExecutableVerifier;

  constructor(
    execute: HelperExecutor = executeHelper,
    verifyExecutable: HelperExecutableVerifier = verifyPackagedHelper,
  ) {
    this.#executablePath = PACKAGED_HELPER_PATH;
    this.#execute = execute;
    this.#verifyExecutable = verifyExecutable;
  }

  async inspect(request: WindowsAclInspectionRequest): Promise<unknown> {
    if (process.platform !== 'win32') {
      throw new Error('Windows ACL helper is unavailable on this platform');
    }
    await this.#verifyExecutable(this.#executablePath);
    const output = await this.#execute(
      this.#executablePath,
      JSON.stringify(request),
    );
    try {
      return JSON.parse(output) as unknown;
    } catch (error) {
      throw new Error('Windows ACL helper returned invalid JSON', {
        cause: error,
      });
    }
  }
}

export class WindowsPathSecurityValidator implements ProtectedPathSecurityValidator {
  readonly #helper: WindowsAclHelper;
  readonly #serviceSid: string;

  constructor(serviceSid: string, helper: WindowsAclHelper) {
    assertLowPrivilegeServiceSid(serviceSid);
    this.#serviceSid = serviceSid;
    this.#helper = helper;
  }

  async assertSecure(path: string): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error('Windows path security validation is unavailable');
    }
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      throw new Error('Protected path must not be a symbolic link or junction');
    }
    const expectedKind = stats.isDirectory()
      ? 'directory'
      : stats.isFile()
        ? 'file'
        : null;
    if (expectedKind === null) {
      throw new Error('Protected path must be a directory or regular file');
    }
    const rawInspection = await this.#helper.inspect({
      expectedKind,
      path,
      protocolVersion: WINDOWS_ACL_HELPER_PROTOCOL_VERSION,
    });
    const inspection = parseWindowsAclInspection(rawInspection);
    assertSecureWindowsAcl(inspection, this.#serviceSid, expectedKind);
  }
}

export function assertSecureWindowsAcl(
  inspection: WindowsAclInspection,
  serviceSid: string,
  expectedKind: WindowsProtectedPathKind,
): void {
  assertLowPrivilegeServiceSid(serviceSid);
  if (
    inspection.protocolVersion !== WINDOWS_ACL_HELPER_PROTOCOL_VERSION ||
    inspection.kind !== expectedKind
  ) {
    throw new Error('Windows ACL helper response does not match the request');
  }
  if (inspection.processSid !== serviceSid) {
    throw new Error('Windows ACL helper is not running as the service user');
  }
  const trustedOwners = new Set([LOCAL_SYSTEM_SID, BUILTIN_ADMINISTRATORS_SID]);
  if (
    !trustedOwners.has(inspection.ownerSid) &&
    !(expectedKind === 'file' && inspection.ownerSid === serviceSid)
  ) {
    throw new Error('Windows protected path has an untrusted owner');
  }
  if (expectedKind === 'directory' && !inspection.aclProtected) {
    throw new Error('Windows protected directory must disable ACL inheritance');
  }
  if (inspection.rules.length === 0 || inspection.rules.length > 64) {
    throw new Error('Windows protected path has an invalid ACL rule count');
  }

  const allowedSids = new Set([...trustedOwners, serviceSid]);
  let directServiceAllowMask = 0;
  let childDirectoryServiceAllowMask = 0;
  let childFileServiceAllowMask = 0;
  for (const rule of inspection.rules) {
    if (
      rule.type === 'allow' &&
      rule.accessMask !== 0 &&
      !allowedSids.has(rule.sid)
    ) {
      throw new Error('Windows protected path grants access to another SID');
    }
    if (expectedKind === 'directory' && rule.inherited) {
      throw new Error(
        'Windows protected directory contains inherited ACL rules',
      );
    }
    if (rule.type === 'deny') {
      throw new Error('Windows protected path must not contain deny ACL rules');
    }
    if (rule.sid === serviceSid) {
      if (!rule.inheritOnly) directServiceAllowMask |= rule.accessMask;
      if (!rule.noPropagate && (rule.inheritanceFlags & 0x1) !== 0) {
        childFileServiceAllowMask |= rule.accessMask;
      }
      if (!rule.noPropagate && (rule.inheritanceFlags & 0x2) !== 0) {
        childDirectoryServiceAllowMask |= rule.accessMask;
      }
    }
  }
  if (
    (directServiceAllowMask & REQUIRED_MODIFY_MASK) !==
    REQUIRED_MODIFY_MASK
  ) {
    throw new Error('Windows service user lacks required path permissions');
  }
  if (
    expectedKind === 'directory' &&
    ((childFileServiceAllowMask & REQUIRED_MODIFY_MASK) !==
      REQUIRED_MODIFY_MASK ||
      (childDirectoryServiceAllowMask & REQUIRED_MODIFY_MASK) !==
        REQUIRED_MODIFY_MASK)
  ) {
    throw new Error(
      'Windows service permissions must fully inherit to child paths',
    );
  }
  const access = inspection.currentProcessAccess;
  if (!access.canRead || !access.canWrite || !access.canDelete) {
    throw new Error('Windows service process lacks effective path access');
  }
}

export function parseWindowsAclInspection(
  value: unknown,
): WindowsAclInspection {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'aclProtected',
      'currentProcessAccess',
      'kind',
      'ownerSid',
      'processSid',
      'protocolVersion',
      'rules',
    ])
  ) {
    throw new Error('Windows ACL helper response has an invalid shape');
  }
  if (
    value.protocolVersion !== WINDOWS_ACL_HELPER_PROTOCOL_VERSION ||
    (value.kind !== 'directory' && value.kind !== 'file') ||
    typeof value.aclProtected !== 'boolean' ||
    typeof value.ownerSid !== 'string' ||
    typeof value.processSid !== 'string' ||
    !Array.isArray(value.rules) ||
    !isRecord(value.currentProcessAccess) ||
    !hasExactKeys(value.currentProcessAccess, [
      'canDelete',
      'canRead',
      'canWrite',
    ]) ||
    typeof value.currentProcessAccess.canDelete !== 'boolean' ||
    typeof value.currentProcessAccess.canRead !== 'boolean' ||
    typeof value.currentProcessAccess.canWrite !== 'boolean'
  ) {
    throw new Error('Windows ACL helper response has an invalid shape');
  }
  assertSid(value.ownerSid);
  assertSid(value.processSid);
  const rules = value.rules.map(parseRule);
  return Object.freeze({
    aclProtected: value.aclProtected,
    currentProcessAccess: Object.freeze({
      canDelete: value.currentProcessAccess.canDelete,
      canRead: value.currentProcessAccess.canRead,
      canWrite: value.currentProcessAccess.canWrite,
    }),
    kind: value.kind,
    ownerSid: value.ownerSid,
    processSid: value.processSid,
    protocolVersion: WINDOWS_ACL_HELPER_PROTOCOL_VERSION,
    rules: Object.freeze(rules),
  });
}

function parseRule(value: unknown): WindowsAclRule {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'accessMask',
      'inheritanceFlags',
      'inherited',
      'inheritOnly',
      'noPropagate',
      'sid',
      'type',
    ])
  ) {
    throw new Error('Windows ACL helper rule has an invalid shape');
  }
  if (
    !isUint32(value.accessMask) ||
    !Number.isInteger(value.inheritanceFlags) ||
    Number(value.inheritanceFlags) < 0 ||
    Number(value.inheritanceFlags) > MAX_INHERITANCE_FLAGS ||
    typeof value.inherited !== 'boolean' ||
    typeof value.inheritOnly !== 'boolean' ||
    typeof value.noPropagate !== 'boolean' ||
    typeof value.sid !== 'string' ||
    (value.type !== 'allow' && value.type !== 'deny')
  ) {
    throw new Error('Windows ACL helper rule has an invalid shape');
  }
  assertSid(value.sid);
  return Object.freeze({
    accessMask: value.accessMask,
    inheritanceFlags: Number(value.inheritanceFlags),
    inherited: value.inherited,
    inheritOnly: value.inheritOnly,
    noPropagate: value.noPropagate,
    sid: value.sid,
    type: value.type,
  });
}

function assertLowPrivilegeServiceSid(value: string): void {
  assertSid(value);
  if (value === LOCAL_SYSTEM_SID || value === BUILTIN_ADMINISTRATORS_SID) {
    throw new TypeError('Windows service SID must be low privilege');
  }
}

function assertSid(value: string): void {
  if (!/^S-\d+(?:-\d+)+$/.test(value)) {
    throw new Error('Windows ACL helper returned an invalid SID');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
}

function isUint32(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    Number(value) >= 0 &&
    Number(value) <= 0xffff_ffff
  );
}

async function verifyPackagedHelper(executablePath: string): Promise<void> {
  const stats = await lstat(executablePath);
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error('Packaged Windows ACL helper must be a regular file');
  }
}

function executeHelper(executablePath: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, [], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    const finish = (error?: Error, output?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error === undefined) resolve(output ?? '');
      else reject(error);
    };
    const timeout = setTimeout(() => {
      child.kill();
      finish(new Error('Windows ACL helper timed out'));
    }, HELPER_TIMEOUT_MS);
    timeout.unref();

    child.once('error', (error) => {
      finish(new Error('Windows ACL helper could not start', { cause: error }));
    });
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_HELPER_OUTPUT_BYTES) {
        child.kill();
        finish(new Error('Windows ACL helper output exceeded its limit'));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_HELPER_OUTPUT_BYTES) {
        child.kill();
        finish(new Error('Windows ACL helper error output exceeded its limit'));
      }
    });
    child.once('close', (code) => {
      if (code !== 0) {
        finish(new Error('Windows ACL helper rejected the inspection'));
        return;
      }
      finish(undefined, Buffer.concat(stdout).toString('utf8'));
    });
    child.stdin.once('error', (error) => {
      finish(new Error('Windows ACL helper input failed', { cause: error }));
    });
    child.stdin.end(input, 'utf8');
  });
}
