const { getDefaultConfig } = require('expo/metro-config');

/**
 * Expo's Metro config already understands a pnpm monorepo: it watches the workspace root and
 * resolves the symlinked `@exyconn/*` packages, whose entry points are TypeScript source.
 */
module.exports = getDefaultConfig(__dirname);
