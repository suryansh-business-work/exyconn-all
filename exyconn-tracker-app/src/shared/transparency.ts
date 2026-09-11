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

/**
 * How far the see-through ground may go. Below half, text sitting on the ground (section
 * headings, captions) loses its contrast against a bright desktop — frosted, never clear.
 */
export const GROUND_OPACITY = { min: 0.5, max: 0.95 } as const;

/** The ground's opacity for these preferences: 1 is solid. A saved value is kept in range. */
export function groundOpacity(
  supported: boolean,
  preferences: { transparentBackground: boolean; backgroundOpacity: number },
): number {
  if (!supported || !preferences.transparentBackground) {
    return 1;
  }
  return Math.min(GROUND_OPACITY.max, Math.max(GROUND_OPACITY.min, preferences.backgroundOpacity));
}
