export type CompressFormat = 'image/jpeg' | 'image/webp';

export interface CompressOptions {
  quality: number; // 0–1
  format: CompressFormat;
  maxDimension?: number;
}

export interface CompressOutput {
  blob: Blob;
  width: number;
  height: number;
}

export type CompressStatus = 'pending' | 'done' | 'error';

export interface CompressItem {
  id: string;
  file: File;
  status: CompressStatus;
  blob?: Blob;
  outputBytes?: number;
  error?: string;
}

export const MAX_FILES = 20;

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const computeScaledDimensions = (
  width: number,
  height: number,
  maxDimension?: number,
): { width: number; height: number } => {
  if (!maxDimension || Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const computeSavedPercent = (originalBytes: number, compressedBytes: number): number => {
  if (originalBytes <= 0) return 0;
  return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
};

export const outputFileName = (name: string, format: CompressFormat): string => {
  const ext = format === 'image/webp' ? 'webp' : 'jpg';
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}-compressed.${ext}`;
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

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image encoding failed.'));
    }, type, quality);
  });

export const compressImage = async (file: File, options: CompressOptions): Promise<CompressOutput> => {
  const img = await loadImage(file);
  const { width, height } = computeScaledDimensions(img.naturalWidth, img.naturalHeight, options.maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, options.format, options.quality);
  return { blob, width, height };
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
