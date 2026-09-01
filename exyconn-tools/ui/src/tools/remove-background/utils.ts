import APIs from '../../shared/config/apis';

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const outputFileName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}-no-background.png`;
};

export const removeBackgroundErrorMessage = (status: number): string => {
  if (status === 413) return 'Image is too large to process. Please upload a smaller image.';
  if (status >= 500) return 'Background removal service is temporarily unavailable. Please try again later.';
  return `Background removal failed (HTTP ${status}).`;
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

export const removeBackground = async (dataUrl: string): Promise<string> => {
  const response = await fetch(APIs.imageTools.removeBackground, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  });
  if (!response.ok) throw new Error(removeBackgroundErrorMessage(response.status));
  const result = await response.json();
  if (!result.image) throw new Error('The server returned no image. Please try again.');
  return result.image as string;
};
