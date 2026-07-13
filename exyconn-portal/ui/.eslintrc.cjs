const muiGuard = {
  paths: [
    { name: '@mui/material', message: 'Import MUI components from "@/components/ui" instead.' },
    {
      name: '@mui/material/styles',
      message: 'Import styling utilities from "@/components/ui/styles" instead.',
    },
    { name: '@mui/x-date-pickers', message: 'Import MUIX pickers from "@/components/ui" instead.' },
  ],
  patterns: [
    { group: ['@mui/material/*'], message: 'Import MUI components from "@/components/ui" instead.' },
    {
      group: ['@mui/x-date-pickers/*'],
      message: 'Import MUIX pickers from "@/components/ui" instead.',
    },
  ],
};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2021: true },
  ignorePatterns: ['dist', 'node_modules', 'src/graphql/generated', 'cypress'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Everything goes through the internal design system (src/components/ui).
    'no-restricted-imports': ['error', muiGuard],
  },
  overrides: [
    {
      // The wrapper itself, theme construction, and the date adapter wiring are
      // the only places allowed to touch MUI packages directly.
      files: ['src/components/ui/**', 'src/config/theme.ts', 'src/theme/**', 'src/App.tsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
