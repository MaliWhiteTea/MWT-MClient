import { Type, type Static } from '@sinclair/typebox';

export const ApiErrorSchema = Type.Object(
  {
    code: Type.String({ minLength: 1, maxLength: 128 }),
    messageKey: Type.String({ minLength: 1, maxLength: 256 }),
    requestId: Type.Optional(Type.String({ minLength: 1, maxLength: 128 })),
  },
  { additionalProperties: false, $id: 'ApiError' },
);

export type ApiError = Static<typeof ApiErrorSchema>;

export const SetupPhaseSchema = Type.Union(
  [
    Type.Literal('bootstrap'),
    Type.Literal('local_only'),
    Type.Literal('lan_enabled'),
  ],
  { $id: 'SetupPhase' },
);

export type SetupPhase = Static<typeof SetupPhaseSchema>;

export const SystemStatusSchema = Type.Object(
  {
    databaseReady: Type.Literal(true),
    databaseSchemaVersion: Type.Integer({ minimum: 0 }),
    product: Type.Literal('MWT-MClient'),
    setupPhase: SetupPhaseSchema,
  },
  { additionalProperties: false, $id: 'SystemStatus' },
);

export type SystemStatus = Static<typeof SystemStatusSchema>;

export const AdminSetupRequestSchema = Type.Object(
  {
    bootstrapProof: Type.String({
      minLength: 43,
      maxLength: 43,
      pattern: '^[A-Za-z0-9_-]+$',
    }),
    displayName: Type.String({
      minLength: 1,
      maxLength: 128,
      pattern: '.*\\S.*',
    }),
    password: Type.String({ minLength: 12, maxLength: 4_096 }),
  },
  { additionalProperties: false, $id: 'AdminSetupRequest' },
);
export type AdminSetupRequest = Static<typeof AdminSetupRequestSchema>;

export const AdminLoginRequestSchema = Type.Object(
  { password: Type.String({ minLength: 1, maxLength: 4_096 }) },
  { additionalProperties: false, $id: 'AdminLoginRequest' },
);
export type AdminLoginRequest = Static<typeof AdminLoginRequestSchema>;

export const AdminSessionStatusSchema = Type.Object(
  {
    authenticated: Type.Literal(true),
    displayName: Type.String({ minLength: 1, maxLength: 128 }),
  },
  { additionalProperties: false, $id: 'AdminSessionStatus' },
);
export type AdminSessionStatus = Static<typeof AdminSessionStatusSchema>;
