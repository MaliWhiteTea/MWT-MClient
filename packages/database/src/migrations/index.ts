import type { SqlMigration } from '../migration.js';
import { initialMigration } from './0001-initial.js';

export const migrations: readonly SqlMigration[] = Object.freeze([
  initialMigration,
]);
