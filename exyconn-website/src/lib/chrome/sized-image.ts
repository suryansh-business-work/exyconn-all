import { IMAGEKIT_HOST } from "./share-image";

/**
 * An uploaded raster image asked from ImageKit at twice the height it is drawn at (sharp on
 * high-density screens), in the best format the browser accepts. The original logo upload is
 * an 84 KB PNG for a 32px-high header slot; this asks for a few KB of WebP or AVIF instead.
 * SVGs and other hosts are returned as given.
 */
export function sizedImage(src: string, height: number): string {
  const url = new URL(src);
  if (url.hostname !== IMAGEKIT_HOST || url.pathname.toLowerCase().endsWith(".svg")) {
    return src;
  }
  url.searchParams.set("tr", `h-${height * 2}`);
  return url.toString();
}
