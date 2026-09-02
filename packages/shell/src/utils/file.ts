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
