import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { muiGuard } from '@exyconn/config/eslint';

export default defineConfig([
  { ignores: ['out/**', 'dist/**', 'node_modules/**', '**/*.cjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // MUI is a declared dependency only because @mui/icons-material, the pickers and
      // emotion resolve against it. Every component this app renders comes from the design
      // system, exactly as the portals do — icons are the one deliberate exception.
      'no-restricted-imports': ['error', muiGuard()],
    },
  },
]);
