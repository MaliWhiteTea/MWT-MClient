import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/control-service/**/*.ts', 'packages/**/*.ts', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/panel/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
);
