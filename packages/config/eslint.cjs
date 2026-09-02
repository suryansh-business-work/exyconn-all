/**
 * ESLint rules shared by every portal package (shell, login and each
 * micro-frontend). `uiImport` names the design-system entry point the package
 * must route MUI through, and `muiAllowed` lists the files exempt from that.
 */
module.exports = function portalEslintConfig({ uiImport, muiAllowed = [] }) {
  const muiGuard = {
    paths: [
      { name: '@mui/material', message: `Import MUI components from "${uiImport}" instead.` },
      {
        name: '@mui/material/styles',
        message: `Import styling utilities from "${uiImport}/styles" instead.`,
      },
      { name: '@mui/x-date-pickers', message: `Import MUIX pickers from "${uiImport}" instead.` },
    ],
    patterns: [
      { group: ['@mui/material/*'], message: `Import MUI components from "${uiImport}" instead.` },
      {
        group: ['@mui/x-date-pickers/*'],
        message: `Import MUIX pickers from "${uiImport}" instead.`,
      },
    ],
  };

  return {
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
      // Everything goes through the internal design system.
      'no-restricted-imports': ['error', muiGuard],
    },
    overrides: muiAllowed.length
      ? [{ files: muiAllowed, rules: { 'no-restricted-imports': 'off' } }]
      : [],
  };
};
