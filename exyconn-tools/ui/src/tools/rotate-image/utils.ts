export type Rotation = 0 | 90 | 180 | 270;

export interface TransformState {
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}

export interface Dimensions {
  width: number;
  height: number;
}

export const INITIAL_TRANSFORM: TransformState = { rotation: 0, flipH: false, flipV: false };

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const PASS_THROUGH_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const rotateBy = (current: Rotation, delta: number): Rotation =>
  ((((current + delta) % 360) + 360) % 360) as Rotation;

export const outputDimensions = (width: number, height: number, rotation: Rotation): Dimensions => {
  if (rotation === 90 || rotation === 270) return { width: height, height: width };
  return { width, height };
};

export const cssTransform = (transform: TransformState): string => {
  const sx = transform.flipH ? -1 : 1;
  const sy = transform.flipV ? -1 : 1;
  return `rotate(${transform.rotation}deg) scale(${sx}, ${sy})`;
};

export const isIdentity = (transform: TransformState): boolean =>
  transform.rotation === 0 && !transform.flipH && !transform.flipV;

export const outputType = (fileType: string): string =>
  PASS_THROUGH_TYPES.has(fileType) ? fileType : 'image/png';

export const outputFileName = (name: string, fileType: string): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `rotated-${base}.${EXTENSIONS[outputType(fileType)]}`;
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

export const applyTransform = async (file: File, transform: TransformState): Promise<Blob> => {
  const img = await loadImage(file);
  const { width, height } = outputDimensions(img.naturalWidth, img.naturalHeight, transform.rotation);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.translate(width / 2, height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvasToBlob(canvas, outputType(file.type), 0.92);
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
