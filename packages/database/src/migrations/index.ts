import type { SqlMigration } from '../migration.js';
import { initialMigration } from './0001-initial.js';
import { adminAuthMigration } from './0002-admin-auth.js';

export const migrations: readonly SqlMigration[] = Object.freeze([
  initialMigration,
  adminAuthMigration,
]);
