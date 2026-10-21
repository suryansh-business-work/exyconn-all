import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/** The build modes and their endpoints. Staging points at production: there is no staging deployment. */
export const MODES = JSON.parse(
  readFileSync(fileURLToPath(new URL('../modes.json', import.meta.url)), 'utf8'),
);

/** The human version from package.json, e.g. 1.2.0. Bumped by hand for a notable change. */
export const PACKAGE_VERSION = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8'),
).version;

/** The CI run that builds the release (EXTENSION_BUILD_NUMBER); 0 for a local build. */
const parsedBuildNumber = Number.parseInt(process.env.EXTENSION_BUILD_NUMBER ?? '0', 10);
export const BUILD_NUMBER = Number.isInteger(parsedBuildNumber) ? parsedBuildNumber : 0;

/**
 * The manifest `version`: the package version, plus the build number as Chrome's fourth part
 * on a CI build (1.2.0 -> 1.2.0.57), so every build is a new version without a manual bump.
 */
export const BUILD_VERSION =
  BUILD_NUMBER > 0 ? `${PACKAGE_VERSION}.${BUILD_NUMBER}` : PACKAGE_VERSION;

/** The manifest `version_name` Chrome shows people, e.g. "1.2.0 (build 57)"; none locally. */
export const BUILD_VERSION_NAME =
  BUILD_NUMBER > 0 ? `${PACKAGE_VERSION} (build ${BUILD_NUMBER})` : undefined;

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
    __VERSION__: JSON.stringify(BUILD_VERSION),
  };
}
