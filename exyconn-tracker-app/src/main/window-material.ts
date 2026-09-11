import type { BrowserWindowConstructorOptions } from 'electron';
import { supportsTransparency } from '@shared/transparency';
// A deep path, as electron.vite.config.ts does: the design system's entry imports MUI.
import { neutral } from '../../../packages/ui/src/tokens/colors.tokens';

/** Fully transparent, so what is behind the page — the material, the desktop — shows. */
const CLEAR = '#00000000';

/** Whether this window should be built see-through, for this install's preference. */
export function wantsTransparency(preferred: boolean): boolean {
  return preferred && supportsTransparency(process.platform, process.getSystemVersion());
}

/**
 * The window's ground, decided when it is BUILT. Transparency cannot be switched on a live
 * window: done at runtime, Windows kept compositing the window as opaque, so the page's
 * see-through ground blended over its own stale frames — text ghosted while scrolling and old
 * pixels lingered at the edges. So a see-through window is created `transparent` (Electron:
 * frameless windows only, which the tracker is), frosted by the OS — acrylic on Windows 11,
 * vibrancy on macOS — and toggling the setting rebuilds the window (see index.ts).
 */
export function windowGroundOptions(transparent: boolean): BrowserWindowConstructorOptions {
  if (!transparent) {
    return { backgroundColor: neutral[900] };
  }
  const frost: BrowserWindowConstructorOptions =
    process.platform === 'darwin'
      ? { vibrancy: 'under-window', visualEffectState: 'active' }
      : { backgroundMaterial: 'acrylic' };
  return { transparent: true, backgroundColor: CLEAR, ...frost };
}
