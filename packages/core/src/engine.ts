export const SUPPORTED_ENGINE_IDS = ['mineflayer'] as const;

export type SupportedEngineId = (typeof SUPPORTED_ENGINE_IDS)[number];
export type EngineCapability = string & {
  readonly __engineCapabilityBrand: unique symbol;
};

export interface EngineStartContext {
  readonly botProfileId: string;
  readonly signal: AbortSignal;
}

export interface EngineEvent {
  readonly name: string;
  readonly payload: unknown;
  readonly sequence: number;
}

export interface EngineAction {
  readonly name: string;
  readonly payload: unknown;
}

export interface EngineActionResult {
  readonly accepted: boolean;
  readonly reason?: string;
}

export interface BotEngine {
  readonly id: SupportedEngineId;
  readonly capabilities: ReadonlySet<EngineCapability>;

  events(): AsyncIterable<EngineEvent>;
  handleAction(action: EngineAction): Promise<EngineActionResult>;
  start(context: EngineStartContext): Promise<void>;
  stop(reason: 'user' | 'service_shutdown' | 'recovery'): Promise<void>;
}
