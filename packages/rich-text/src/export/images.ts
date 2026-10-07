import type { Block } from './model';

/** An image read into memory as PNG, ready for either file format. */
export interface LoadedImage {
  dataUrl: string;
  bytes: Uint8Array;
  width: number;
  height: number;
}

export type ImageMap = ReadonlyMap<string, LoadedImage>;

/** Every image source in the document, nested ones included, each once. */
export function imageSources(blocks: readonly Block[]): string[] {
  const sources = new Set<string>();
  const visit = (block: Block) => {
    switch (block.kind) {
      case 'image':
        sources.add(block.src);
        break;
      case 'quote':
        block.blocks.forEach(visit);
        break;
      case 'list':
        block.items.forEach((item) => item.blocks.forEach(visit));
        break;
      case 'table':
        block.rows.flat().forEach((cell) => cell.blocks.forEach(visit));
        break;
      default:
        break;
    }
  };
  blocks.forEach(visit);
  return [...sources].filter(Boolean);
}

function base64Bytes(dataUrl: string): Uint8Array {
  const binary = globalThis.atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return Uint8Array.from(binary, (char) => Number(char.codePointAt(0)));
}

/**
 * Draws an image onto a canvas and reads it back as PNG. One format whatever was uploaded:
 * neither PDF nor Word can embed WebP, and the editor's images are often served as WebP.
 */
async function loadImage(src: string): Promise<LoadedImage> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  // Rejects if the image is missing or its host refuses a cross-origin read.
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser cannot draw images for export');
  }
  context.drawImage(image, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl,
    bytes: base64Bytes(dataUrl),
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

/** Loads every image the document shows, in parallel, keyed by its source. */
export async function loadImages(blocks: readonly Block[]): Promise<ImageMap> {
  const entries = await Promise.all(
    imageSources(blocks).map(async (src) => [src, await loadImage(src)] as const),
  );
  return new Map(entries);
}

/**
 * The size an image prints at: the width it was given in the editor (or its own), never
 * wider than the page allows, with its height kept in proportion. In CSS pixels.
 */
export function printedSize(
  loaded: LoadedImage,
  declaredWidth: number | undefined,
  maxWidth: number,
): { width: number; height: number } {
  const width = Math.min(declaredWidth ?? loaded.width, maxWidth);
  return { width, height: Math.round((loaded.height / loaded.width) * width) };
}
