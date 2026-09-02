/** The config package ships plain Node ESM helpers, not React code. */
module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended'],
  env: { node: true, es2022: true },
  ignorePatterns: ['eslint.cjs'],
};
