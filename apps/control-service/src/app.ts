import {
  AdminLoginRequestSchema,
  AdminSessionStatusSchema,
  AdminSetupRequestSchema,
  ApiErrorSchema,
  SystemStatusSchema,
  type AdminLoginRequest,
  type AdminSessionStatus,
  type AdminSetupRequest,
  type ApiError,
  type SetupPhase,
  type SystemStatus,
} from '@mwt-mclient/contracts';
import {
  AdminPasswordAuthenticator,
  AdminPasswordPolicyError,
  AdminPasswordWorkBusyError,
  createAdminPasswordVerifier,
  createAdminSession,
  verifyBootstrapProof,
  type AdminPasswordVerifier,
  type AdminSessionRecord,
  type BootstrapProofRecord,
  type SessionAudience,
} from '@mwt-mclient/core';
import {
  openControlDatabase,
  type ActiveAdminSession,
  type CreateAdministratorInput,
  type DatabaseDiagnostics,
  type OpenDatabaseOptions,
} from '@mwt-mclient/database';
import Fastify, { type FastifyInstance } from 'fastify';

interface ServiceDatabase {
  close(): void;
  createAdministrator(input: CreateAdministratorInput): void;
  createAdminSession(session: AdminSessionRecord): void;
  diagnostics(): DatabaseDiagnostics;
  getAdministrator(): {
    readonly displayName: string;
    readonly passwordVerifier: AdminPasswordVerifier;
  } | null;
  hasAdministrator(): boolean;
  resumeAdminSession(
    token: string,
    audience: SessionAudience,
    now?: Date,
  ): ActiveAdminSession | null;
  revokeAdminSession(token: string, revokedAt?: Date): boolean;
}

export interface ControlServiceOptions {
  readonly bootstrapProof: BootstrapProofRecord;
  readonly databasePath: string;
  readonly getSetupPhase?: () => SetupPhase;
  readonly loopbackOrigins: readonly string[];
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
    const loopbackOrigins = validateLoopbackOrigins(options.loopbackOrigins);
    const authenticator = new AdminPasswordAuthenticator();
    let bootstrapProofConsumed = false;
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

    app.addHook('onRequest', async (request, reply) => {
      const host = request.headers.host?.toLowerCase();
      if (
        !isLoopbackAddress(request.ip) ||
        host === undefined ||
        !isAllowedHost(host, loopbackOrigins)
      ) {
        return reply.code(403).send(apiError('access_denied'));
      }
      if (isStateChanging(request.method)) {
        const origin = request.headers.origin;
        if (origin === undefined || !loopbackOrigins.has(origin)) {
          return reply.code(403).send(apiError('origin_denied'));
        }
      }
    });

    app.setErrorHandler((error, _request, reply) => {
      const isValidationError =
        typeof error === 'object' &&
        error !== null &&
        'validation' in error &&
        error.validation !== undefined;
      const statusCode = isValidationError ? 400 : 500;
      return reply
        .code(statusCode)
        .send(
          apiError(statusCode === 400 ? 'invalid_request' : 'internal_error'),
        );
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

    app.post<{ Body: AdminSetupRequest; Reply: AdminSessionStatus | ApiError }>(
      '/api/v1/setup/admin',
      {
        schema: {
          body: AdminSetupRequestSchema,
          response: {
            201: AdminSessionStatusSchema,
            403: ApiErrorSchema,
            409: ApiErrorSchema,
            429: ApiErrorSchema,
          },
        },
      },
      async (request, reply) => {
        if (database.hasAdministrator()) {
          return reply.code(409).send(apiError('administrator_exists'));
        }
        if (
          bootstrapProofConsumed ||
          !verifyBootstrapProof(
            request.body.bootstrapProof,
            options.bootstrapProof,
          )
        ) {
          return reply.code(403).send(apiError('bootstrap_proof_invalid'));
        }
        try {
          const passwordVerifier = await createAdminPasswordVerifier(
            request.body.password,
          );
          database.createAdministrator({
            displayName: request.body.displayName,
            passwordVerifier,
          });
          const session = createAdminSession('loopback');
          database.createAdminSession(session);
          bootstrapProofConsumed = true;
          setSessionCookie(reply, session.token);
          return reply.code(201).send({
            authenticated: true,
            displayName: request.body.displayName,
          });
        } catch (error) {
          if (error instanceof AdminPasswordWorkBusyError) {
            return reply.code(429).send(apiError('authentication_busy'));
          }
          if (error instanceof AdminPasswordPolicyError) {
            return reply.code(409).send(apiError('password_policy'));
          }
          if (database.hasAdministrator()) {
            return reply.code(409).send(apiError('administrator_exists'));
          }
          throw error;
        }
      },
    );

    app.post<{ Body: AdminLoginRequest; Reply: AdminSessionStatus | ApiError }>(
      '/api/v1/auth/session',
      {
        schema: {
          body: AdminLoginRequestSchema,
          response: {
            200: AdminSessionStatusSchema,
            401: ApiErrorSchema,
            429: ApiErrorSchema,
          },
        },
      },
      async (request, reply) => {
        const administrator = database.getAdministrator();
        if (administrator === null) {
          return reply.code(401).send(apiError('invalid_credentials'));
        }
        const result = await authenticator.verify(
          request.body.password,
          administrator.passwordVerifier,
        );
        if (result === 'busy') {
          return reply.code(429).send(apiError('authentication_limited'));
        }
        if (result === 'invalid') {
          return reply.code(401).send(apiError('invalid_credentials'));
        }
        const session = createAdminSession('loopback');
        database.createAdminSession(session);
        setSessionCookie(reply, session.token);
        return { authenticated: true, displayName: administrator.displayName };
      },
    );

    app.get<{ Reply: AdminSessionStatus | ApiError }>(
      '/api/v1/auth/session',
      {
        schema: {
          response: { 200: AdminSessionStatusSchema, 401: ApiErrorSchema },
        },
      },
      async (request, reply) => {
        const token = readSessionCookie(request.headers.cookie);
        const session =
          token === null
            ? null
            : database.resumeAdminSession(token, 'loopback');
        const administrator =
          session === null ? null : database.getAdministrator();
        if (administrator === null) {
          return reply.code(401).send(apiError('authentication_required'));
        }
        return { authenticated: true, displayName: administrator.displayName };
      },
    );

    app.delete('/api/v1/auth/session', async (request, reply) => {
      const token = readSessionCookie(request.headers.cookie);
      if (token !== null) database.revokeAdminSession(token);
      clearSessionCookie(reply);
      return reply.code(204).send();
    });
    return app;
  } catch (error) {
    database.close();
    throw error;
  }
}

const SESSION_COOKIE = 'mwt_loopback_session';

function validateLoopbackOrigins(
  origins: readonly string[],
): ReadonlySet<string> {
  const accepted = new Set<string>();
  for (const value of origins) {
    const url = new URL(value);
    if (
      url.protocol !== 'http:' ||
      url.origin !== value ||
      !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
    ) {
      throw new TypeError(
        'loopbackOrigins must contain exact loopback HTTP origins',
      );
    }
    accepted.add(url.origin);
  }
  if (accepted.size === 0)
    throw new TypeError('At least one loopback origin is required');
  return accepted;
}

function isLoopbackAddress(address: string): boolean {
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  );
}

function isAllowedHost(host: string, origins: ReadonlySet<string>): boolean {
  try {
    return origins.has(new URL(`http://${host}`).origin);
  } catch {
    return false;
  }
}

function isStateChanging(method: string): boolean {
  return ['DELETE', 'PATCH', 'POST', 'PUT'].includes(method);
}

function apiError(code: string): ApiError {
  return { code, messageKey: `api.error.${code}` };
}

function setSessionCookie(
  reply: { header(name: string, value: string): unknown },
  token: string,
): void {
  reply.header(
    'set-cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
  );
}

function clearSessionCookie(reply: {
  header(name: string, value: string): unknown;
}): void {
  reply.header(
    'set-cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}

function readSessionCookie(header: string | undefined): string | null {
  if (header === undefined) return null;
  for (const part of header.split(';')) {
    const [name, value, ...rest] = part.trim().split('=');
    if (
      name === SESSION_COOKIE &&
      value !== undefined &&
      rest.length === 0 &&
      /^[A-Za-z0-9_-]{43}$/.test(value)
    ) {
      return value;
    }
  }
  return null;
}
