import {
  SystemStatusSchema,
  type SetupPhase,
  type SystemStatus,
} from '@mwt-mclient/contracts';
import Fastify, { type FastifyInstance } from 'fastify';

export interface ControlServiceOptions {
  readonly getSetupPhase?: () => SetupPhase;
}

export function createControlService(
  options: ControlServiceOptions = {},
): FastifyInstance {
  const getSetupPhase = options.getSetupPhase ?? (() => 'bootstrap');
  const app = Fastify({
    logger: false,
    trustProxy: false,
  });

  app.get<{ Reply: SystemStatus }>(
    '/api/v1/system/status',
    {
      schema: {
        response: {
          200: SystemStatusSchema,
        },
      },
    },
    async () => ({
      product: 'MWT-MClient',
      setupPhase: getSetupPhase(),
    }),
  );

  return app;
}
