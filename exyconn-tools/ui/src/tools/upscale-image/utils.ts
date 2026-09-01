import APIs from '../../shared/config/apis';

export type UpscaleScale = 2 | 4;

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const outputFileName = (name: string, scale: UpscaleScale): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : 'png';
  return `${base}-upscaled-${scale}x.${ext}`;
};

export const upscaleErrorMessage = (status: number): string => {
  if (status === 413) return 'Image is too large to upscale. Please upload a smaller image.';
  if (status >= 500) return 'Upscaling service is temporarily unavailable. Please try again later.';
  return `Upscaling failed (HTTP ${status}).`;
};

export const upscaleImage = async (file: File, scale: UpscaleScale): Promise<Blob> => {
  const form = new FormData();
  form.append('image', file);
  form.append('scale', String(scale));
  const response = await fetch(APIs.imageTools.upscale, { method: 'POST', body: form });
  if (!response.ok) throw new Error(upscaleErrorMessage(response.status));
  return response.blob();
};
