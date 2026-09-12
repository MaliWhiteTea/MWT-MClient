import { afterEach, describe, expect, it } from 'vitest';

import { createControlService } from './app.js';

const apps: ReturnType<typeof createControlService>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('control service contract', () => {
  it('reports bootstrap status without opening a network listener', async () => {
    const app = createControlService();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/system/status',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      product: 'MWT-MClient',
      setupPhase: 'bootstrap',
    });
    expect(app.server.listening).toBe(false);
  });
});
