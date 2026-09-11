import type { BrowserWindow } from 'electron';
import { supportsTransparency } from '@shared/transparency';
// A deep path, as electron.vite.config.ts does: the design system's entry imports MUI.
import { neutral } from '../../../packages/ui/src/tokens/colors.tokens';

/** Fully transparent, so the native material behind the page is what shows. */
const CLEAR = '#00000000';

/**
 * Lets the desktop show through the window's ground, or paints it solid again. The renderer
 * decides how much of its own ground stays painted; this only opens or closes the window.
 */
export function applyWindowMaterial(win: BrowserWindow, transparent: boolean): void {
  if (win.isDestroyed() || !supportsTransparency(process.platform, process.getSystemVersion())) {
    return;
  }
  if (process.platform === 'darwin') {
    win.setVibrancy(transparent ? 'under-window' : null);
  } else {
    win.setBackgroundMaterial(transparent ? 'acrylic' : 'none');
  }
  win.setBackgroundColor(transparent ? CLEAR : neutral[900]);
}
