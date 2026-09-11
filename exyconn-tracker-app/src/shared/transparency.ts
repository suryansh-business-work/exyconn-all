/** Windows 11 22H2: the first build whose windows can ask for the acrylic system backdrop. */
const FIRST_ACRYLIC_BUILD = 22621;

/**
 * Whether this OS can blur the desktop behind a window: macOS vibrancy, and the acrylic
 * backdrop of Windows 11 22H2 and later (older Windows would only paint the clear window
 * black). Linux has neither, so the setting is not offered there. Shared so main (which opens
 * the window) and the renderer (which offers the switch and thins its ground) can never
 * disagree. `systemVersion` is Electron's `process.getSystemVersion()` — "10.0.22631" on Windows.
 */
export function supportsTransparency(platform: string, systemVersion: string): boolean {
  if (platform === 'darwin') {
    return true;
  }
  if (platform !== 'win32') {
    return false;
  }
  const build = Number.parseInt(systemVersion.split('.')[2] ?? '', 10);
  return build >= FIRST_ACRYLIC_BUILD;
}

/** The ground's opacity for these preferences: 1 is solid. */
export function groundOpacity(
  supported: boolean,
  preferences: { transparentBackground: boolean; backgroundOpacity: number },
): number {
  return supported && preferences.transparentBackground ? preferences.backgroundOpacity : 1;
}
