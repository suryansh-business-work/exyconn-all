import { toJpeg, toPng, toSvg } from 'html-to-image';

export type ImageFormat = 'png' | 'jpeg' | 'svg';

export interface CaptureOptions {
  format: ImageFormat;
  width: number;
  height: number;
  scale: number;
}

export const MAX_DIMENSION = 4096;

const SCRIPT_BLOCK_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const SCRIPT_TAG_PATTERN = /<\/?script\b[^>]*>/gi;

/** Removes <script> blocks (and stray script tags) so pasted snippets never execute. */
export const stripScripts = (html: string): string =>
  html.replaceAll(SCRIPT_BLOCK_PATTERN, '').replaceAll(SCRIPT_TAG_PATTERN, '');

export const clampDimension = (value: number): number => {
  if (Number.isNaN(value)) return 1;
  return Math.min(MAX_DIMENSION, Math.max(1, Math.round(value)));
};

export const outputFileName = (format: ImageFormat): string => {
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `html-snippet.${ext}`;
};

export const captureNode = (node: HTMLElement, options: CaptureOptions): Promise<string> => {
  const common = { width: options.width, height: options.height, pixelRatio: options.scale };
  if (options.format === 'jpeg') return toJpeg(node, { ...common, quality: 0.95, backgroundColor: '#ffffff' });
  if (options.format === 'svg') return toSvg(node, common);
  return toPng(node, common);
};

export const downloadDataUrl = (dataUrl: string, fileName: string): void => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
};
