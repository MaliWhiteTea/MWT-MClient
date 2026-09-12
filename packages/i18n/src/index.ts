import { tr } from './tr.js';

export { tr } from './tr.js';

export type TranslationKey = keyof typeof tr;

export function translate(key: TranslationKey): string {
  return tr[key];
}
