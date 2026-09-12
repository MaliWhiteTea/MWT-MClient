import {
  SystemStatusSchema,
  type SetupPhase,
  type SystemStatus,
} from '@mwt-mclient/contracts';
import {
  openControlDatabase,
  type DatabaseDiagnostics,
  type OpenDatabaseOptions,
} from '@mwt-mclient/database';
import Fastify, { type FastifyInstance } from 'fastify';

interface ServiceDatabase {
  close(): void;
  diagnostics(): DatabaseDiagnostics;
  hasAdministrator(): boolean;
}

export interface ControlServiceOptions {
  readonly databasePath: string;
  readonly getSetupPhase?: () => SetupPhase;
  readonly openDatabase?: (
    options: OpenDatabaseOptions,
  ) => Promise<ServiceDatabase>;
}

export async function createControlService(
  options: ControlServiceOptions,
): Promise<FastifyInstance> {
  const database = await (options.openDatabase ?? openControlDatabase)({
    path: options.databasePath,
  });

  try {
    const getSetupPhase =
      options.getSetupPhase ??
      (() => (database.hasAdministrator() ? 'local_only' : 'bootstrap'));
    const databaseSchemaVersion = database.diagnostics().schemaVersion;
    const app = Fastify({
      logger: false,
      trustProxy: false,
    });

    app.addHook('onClose', async () => {
      database.close();
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
        databaseReady: true,
        databaseSchemaVersion,
        product: 'MWT-MClient',
        setupPhase: getSetupPhase(),
      }),
    );
    return app;
  } catch (error) {
    database.close();
    throw error;
  }
}
