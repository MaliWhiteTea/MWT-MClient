export type SecretReference = string & {
  readonly __secretReferenceBrand: unique symbol;
};

export interface SecretVault {
  delete(reference: SecretReference): Promise<void>;
  get(reference: SecretReference): Promise<Uint8Array | null>;
  isAvailable(): Promise<boolean>;
  put(value: Uint8Array): Promise<SecretReference>;
}

export class VaultUnavailableError extends Error {
  constructor() {
    super('The secure vault is unavailable');
    this.name = 'VaultUnavailableError';
  }
}
