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
    product: Type.Literal('MWT-MClient'),
    setupPhase: SetupPhaseSchema,
  },
  { additionalProperties: false, $id: 'SystemStatus' },
);

export type SystemStatus = Static<typeof SystemStatusSchema>;
