import { describe, expect, it } from 'vitest';

import { InvalidSetupTransitionError, transitionSetup } from './setup-state.js';

describe('setup state machine', () => {
  it('requires an administrator before LAN can be enabled', () => {
    expect(() => transitionSetup('bootstrap', { type: 'lan.enabled' })).toThrow(
      InvalidSetupTransitionError,
    );
  });

  it('enables LAN only after local administrator creation', () => {
    const localOnly = transitionSetup('bootstrap', { type: 'admin.created' });
    expect(localOnly).toBe('local_only');
    expect(transitionSetup(localOnly, { type: 'lan.enabled' })).toBe(
      'lan_enabled',
    );
  });

  it('returns recovery to bootstrap with LAN disabled', () => {
    expect(transitionSetup('lan_enabled', { type: 'admin.reset' })).toBe(
      'bootstrap',
    );
  });
});
