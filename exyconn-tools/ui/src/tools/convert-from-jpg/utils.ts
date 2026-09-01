export type TargetFormat = 'image/png' | 'image/webp';

export type ConvertStatus = 'pending' | 'done' | 'error';

export interface ConvertItem {
  id: string;
  file: File;
  status: ConvertStatus;
  blob?: Blob;
  error?: string;
}

export const MAX_FILES = 20;

export const ACCEPTED_TYPES = new Set(['image/jpeg']);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const outputFileName = (name: string, format: TargetFormat): string => {
  const ext = format === 'image/webp' ? 'webp' : 'png';
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
};

export const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}.`));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image encoding failed.'));
    }, type, quality);
  });

export const convertFromJpg = async (file: File, format: TargetFormat, quality: number): Promise<Blob> => {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // PNG is lossless — the quality parameter only applies to WEBP.
  const encodeQuality = format === 'image/webp' ? quality : undefined;
  return canvasToBlob(canvas, format, encodeQuality);
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
