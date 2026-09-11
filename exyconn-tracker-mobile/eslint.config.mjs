import { portalEslintConfig } from '@exyconn/config/eslint';

/** The workspace's shared rules; React Native adds only its `__DEV__` global. */
export default [
  ...portalEslintConfig(),
  { ignores: ['android/**', 'ios/**', '.expo/**', 'plugins/**', '*.config.js', '*.config.mjs', '*.config.mts'] },
  { languageOptions: { globals: { __DEV__: 'readonly' } } },
];
