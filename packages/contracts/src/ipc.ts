import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const IPC_PROTOCOL_VERSION = 1 as const;

const IpcHeader = {
  protocolVersion: Type.Literal(IPC_PROTOCOL_VERSION),
  requestId: Type.String({ minLength: 1, maxLength: 128 }),
  sequence: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
};

export const WorkerStartCommandSchema = Type.Object(
  {
    ...IpcHeader,
    type: Type.Literal('engine.start'),
    payload: Type.Object(
      {
        botProfileId: Type.String({ minLength: 1, maxLength: 128 }),
        engineId: Type.Literal('mineflayer'),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false, $id: 'WorkerStartCommand' },
);

export const WorkerStopCommandSchema = Type.Object(
  {
    ...IpcHeader,
    type: Type.Literal('engine.stop'),
    payload: Type.Object(
      {
        reason: Type.Union([
          Type.Literal('user'),
          Type.Literal('service_shutdown'),
          Type.Literal('recovery'),
        ]),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false, $id: 'WorkerStopCommand' },
);

export const WorkerStatusEventSchema = Type.Object(
  {
    ...IpcHeader,
    type: Type.Literal('engine.status'),
    payload: Type.Object(
      {
        status: Type.Union([
          Type.Literal('starting'),
          Type.Literal('running'),
          Type.Literal('stopping'),
          Type.Literal('stopped'),
          Type.Literal('attention_required'),
        ]),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false, $id: 'WorkerStatusEvent' },
);

export const ControlToWorkerEnvelopeSchema = Type.Union(
  [WorkerStartCommandSchema, WorkerStopCommandSchema],
  { $id: 'ControlToWorkerEnvelope' },
);

export const WorkerToControlEnvelopeSchema = WorkerStatusEventSchema;

export type ControlToWorkerEnvelope = Static<
  typeof ControlToWorkerEnvelopeSchema
>;
export type WorkerToControlEnvelope = Static<
  typeof WorkerToControlEnvelopeSchema
>;
export type WorkerStartCommand = Static<typeof WorkerStartCommandSchema>;
export type WorkerStopCommand = Static<typeof WorkerStopCommandSchema>;
export type WorkerStatusEvent = Static<typeof WorkerStatusEventSchema>;

export function isControlToWorkerEnvelope(
  value: unknown,
): value is ControlToWorkerEnvelope {
  return Value.Check(ControlToWorkerEnvelopeSchema, value);
}

export function isWorkerToControlEnvelope(
  value: unknown,
): value is WorkerToControlEnvelope {
  return Value.Check(WorkerToControlEnvelopeSchema, value);
}
