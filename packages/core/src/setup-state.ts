import type { SetupPhase } from '@mwt-mclient/contracts';

export type SetupEvent =
  | { type: 'admin.created' }
  | { type: 'admin.reset' }
  | { type: 'lan.disabled' }
  | { type: 'lan.enabled' };

export class InvalidSetupTransitionError extends Error {
  constructor(
    public readonly phase: SetupPhase,
    public readonly event: SetupEvent,
  ) {
    super(`Invalid setup transition: ${phase} -> ${event.type}`);
    this.name = 'InvalidSetupTransitionError';
  }
}

export function transitionSetup(
  phase: SetupPhase,
  event: SetupEvent,
): SetupPhase {
  if (event.type === 'admin.reset' && phase !== 'bootstrap') {
    return 'bootstrap';
  }

  if (phase === 'bootstrap' && event.type === 'admin.created') {
    return 'local_only';
  }

  if (phase === 'local_only' && event.type === 'lan.enabled') {
    return 'lan_enabled';
  }

  if (phase === 'lan_enabled' && event.type === 'lan.disabled') {
    return 'local_only';
  }

  throw new InvalidSetupTransitionError(phase, event);
}
