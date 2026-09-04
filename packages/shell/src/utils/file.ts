/** Reads a File as a base64 data URL (used for avatar uploads). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

/** Upper bound for images uploaded through the shared ImageUploadDialog. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Human file size, e.g. `84.2 MB`. Used wherever a download or upload is sized. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

/**
 * Hands the browser a file the server produced, e.g. a payslip PDF returned base64
 * encoded from GraphQL. Decoded here rather than fetched from a URL so the download
 * goes through the same authenticated GraphQL call the rest of the portal uses.
 */
export function downloadBase64File(filename: string, contentType: string, base64: string): void {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
