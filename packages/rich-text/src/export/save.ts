/** Characters no file system accepts in a name, replaced when a title becomes a file name. */
const UNSAFE = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|']);

/** A document title as a safe file name stem — `"NDA: Acme / 2026"` becomes `NDA- Acme - 2026`. */
export function fileStem(title: string): string {
  const safe = [...title.trim()].map((char) => (UNSAFE.has(char) ? '-' : char)).join('');
  return safe || 'document';
}

/** Hands the browser a file to save. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
