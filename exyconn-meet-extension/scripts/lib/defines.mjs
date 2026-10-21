import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/** The build modes and their endpoints. Staging points at production: there is no staging deployment. */
export const MODES = JSON.parse(
  readFileSync(fileURLToPath(new URL('../modes.json', import.meta.url)), 'utf8'),
);

/** The package version, which is also the manifest version. */
export const PACKAGE_VERSION = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8'),
).version;

/** Resolves one mode's endpoints, failing loudly on a typo instead of building a broken bundle. */
export function modeConfig(mode) {
  const config = MODES[mode];
  if (!config) {
    throw new Error(`Unknown build mode "${mode}". Use one of: ${Object.keys(MODES).join(', ')}`);
  }
  return config;
}

/** The compile-time constants every bundle reads (see src/config.ts). */
export function defineConstants(mode) {
  const { apiUrl, portalUrl } = modeConfig(mode);
  return {
    __API_URL__: JSON.stringify(apiUrl),
    __PORTAL_URL__: JSON.stringify(portalUrl),
    __MODE__: JSON.stringify(mode),
    __VERSION__: JSON.stringify(PACKAGE_VERSION),
  };
}
