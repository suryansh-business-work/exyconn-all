import { app } from 'electron';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Windows can draw the picture across the top of a toast — the "hero" image — but only for a
 * notification handed over as raw toast XML, and only for an image the shell can read off
 * disk. macOS and Linux have no equivalent placement: they draw the image beside the text,
 * which is what `icon` already gives them.
 */

/**
 * The shell reads the file after `show()` returns, so previews rotate over a few slots rather
 * than reusing one path — bounded disk use, and never overwriting a toast still on screen.
 */
const SLOTS = 3;
let slot = 0;

/** Writes the preview where the shell can read it, and returns its file:// URL. */
function writePreview(image: Electron.NativeImage): string | undefined {
  try {
    const file = join(app.getPath('temp'), `exyconn-toast-${slot}.png`);
    slot = (slot + 1) % SLOTS;
    writeFileSync(file, image.toPNG());
    return pathToFileURL(file).href;
  } catch {
    return undefined;
  }
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** Window titles reach the toast verbatim, and a stray `&` would make the XML unparseable. */
function escapeXml(text: string): string {
  return text.replaceAll(/[&<>"]/g, (character) => ESCAPES[character] ?? character);
}

/**
 * Builds a toast showing `image` above `title` and `lines`. Returns undefined when the
 * preview cannot be written, so the caller can fall back to the ordinary notification.
 */
export function heroToastXml(
  title: string,
  lines: string[],
  image: Electron.NativeImage,
): string | undefined {
  const src = writePreview(image);
  if (src === undefined) {
    return undefined;
  }
  const text = [title, ...lines].map((line) => `<text>${escapeXml(line)}</text>`).join('');
  const hero = `<image placement="hero" src="${escapeXml(src)}"/>`;
  return `<toast><visual><binding template="ToastGeneric">${hero}${text}</binding></visual></toast>`;
}
