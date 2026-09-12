import { describe, expect, it } from 'vitest';

import {
  IPC_PROTOCOL_VERSION,
  isControlToWorkerEnvelope,
  isWorkerToControlEnvelope,
} from './ipc.js';

const startCommand = {
  protocolVersion: IPC_PROTOCOL_VERSION,
  requestId: 'request-1',
  sequence: 0,
  type: 'engine.start',
  payload: {
    botProfileId: 'profile-1',
    engineId: 'mineflayer',
  },
} as const;

const statusEvent = {
  protocolVersion: IPC_PROTOCOL_VERSION,
  requestId: 'request-2',
  sequence: 1,
  type: 'engine.status',
  payload: { status: 'running' },
} as const;

describe('directional IPC envelope validation', () => {
  it('accepts messages only in their declared direction', () => {
    expect(isControlToWorkerEnvelope(startCommand)).toBe(true);
    expect(isWorkerToControlEnvelope(startCommand)).toBe(false);
    expect(isWorkerToControlEnvelope(statusEvent)).toBe(true);
    expect(isControlToWorkerEnvelope(statusEvent)).toBe(false);
  });

  it('rejects unsupported engines and extra fields', () => {
    expect(
      isControlToWorkerEnvelope({
        ...startCommand,
        payload: {
          botProfileId: 'profile-1',
          engineId: 'headlessmc',
          token: 'must-not-cross-this-contract',
        },
      }),
    ).toBe(false);
  });

  it('rejects unknown protocol versions', () => {
    expect(
      isControlToWorkerEnvelope({
        protocolVersion: 2,
        requestId: 'request-3',
        sequence: 2,
        type: 'engine.stop',
        payload: { reason: 'user' },
      }),
    ).toBe(false);
  });

  it('accepts the largest safe sequence and rejects overflow', () => {
    expect(
      isWorkerToControlEnvelope({
        ...statusEvent,
        sequence: Number.MAX_SAFE_INTEGER,
      }),
    ).toBe(true);
    expect(
      isWorkerToControlEnvelope({
        ...statusEvent,
        sequence: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toBe(false);
  });
});
