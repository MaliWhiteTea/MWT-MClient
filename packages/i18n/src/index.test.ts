import { describe, expect, it } from 'vitest';

import { translate } from './index.js';

describe('Turkish catalog', () => {
  it('provides the initial product name', () => {
    expect(translate('app.name')).toBe('MWT-MClient');
  });
});
