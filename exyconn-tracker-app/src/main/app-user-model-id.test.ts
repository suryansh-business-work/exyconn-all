import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Windows shows a toast only for an app it can identify, and it identifies one by the
 * AppUserModelID the app declares matching the one the installer stamped on its Start Menu
 * shortcut — which electron-builder takes from `appId`. When the two drift, nothing errors:
 * notifications simply stop appearing, on Windows only, for everybody.
 *
 * So the id in the source is read back against electron-builder.yml here rather than trusted.
 */
const MAIN = fileURLToPath(new URL('./index.ts', import.meta.url));
const BUILDER = fileURLToPath(new URL('../../electron-builder.yml', import.meta.url));

/** The value of `const APP_USER_MODEL_ID = '…'` in the main process entry point. */
function declaredId(): string | undefined {
  const source = readFileSync(MAIN, 'utf8');
  return /const APP_USER_MODEL_ID = '([^']+)'/.exec(source)?.[1];
}

/** The `appId:` line of electron-builder.yml (a one-key lookup does not need a YAML parser). */
function packagedId(): string | undefined {
  const source = readFileSync(BUILDER, 'utf8');
  return /^appId:\s*(\S+)\s*$/m.exec(source)?.[1];
}

describe('Windows AppUserModelID', () => {
  it('matches the appId the installer stamps on the shortcut', () => {
    const declared = declaredId();

    expect(declared).toBeDefined();
    expect(declared).toBe(packagedId());
  });

  it('is actually applied on startup, or Windows drops every notification', () => {
    expect(readFileSync(MAIN, 'utf8')).toContain('app.setAppUserModelId(APP_USER_MODEL_ID)');
  });
});
