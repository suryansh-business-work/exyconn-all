import { fileURLToPath, URL } from 'node:url';

/** Package root, the build output, its sidecar build info and the release artifacts. */
export const PACKAGE_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const SRC_DIR = fileURLToPath(new URL('../../src/', import.meta.url));
export const OUT_DIR = fileURLToPath(
  new URL('../../dist/chrome-meeting-assistant/', import.meta.url),
);
export const BUILD_INFO = fileURLToPath(new URL('../../dist/build-info.json', import.meta.url));
export const ARTIFACTS_DIR = fileURLToPath(new URL('../../artifacts/', import.meta.url));
export const UI_SRC = fileURLToPath(new URL('../../../packages/ui/src', import.meta.url));
