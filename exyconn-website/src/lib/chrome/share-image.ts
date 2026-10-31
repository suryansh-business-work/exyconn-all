import type { SeoImage } from "@exyconn/seo";

/** The size link previews (WhatsApp, LinkedIn, X, Facebook) draw a large card at. */
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

export const IMAGEKIT_HOST = "ik.imagekit.io";

const MIME_BY_EXTENSION = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
  ["svg", "image/svg+xml"],
]);

/** A six-digit hex colour without its "#", upper-cased, as ImageKit's `bg-` takes it; else "". */
const imagekitColour = (colour: string): string => {
  const hex = colour.replace(/^#/, "");
  return /^[\da-f]{6}$/i.test(hex) ? hex.toUpperCase() : "";
};

/**
 * The MIME type a URL names: Unsplash/Pexels-style `fm=` / `format=` first, then the path's
 * extension. Empty when the URL does not say (the head then prints no og:image:type).
 */
function mimeOf(url: URL): string {
  const format = url.searchParams.get("fm") ?? url.searchParams.get("format") ?? "";
  const extension = /\.(\w+)$/.exec(url.pathname)?.[1] ?? "";
  return MIME_BY_EXTENSION.get((format || extension).toLowerCase()) ?? "";
}

/**
 * A page's share image, made safe for link previews.
 *
 * Admin › Branding and the CMS upload to ImageKit, so an uploaded logo or a portrait photo
 * would otherwise be declared 1200×630 while being neither: WhatsApp then square-crops it
 * (the "exyc" preview). ImageKit is asked to fit such an image inside a 1200×630 JPEG,
 * padded with the brand background, so the declared size is the real one. Any other host is
 * left as given, and its seed is expected to request 1200×630 itself.
 */
export function shareImage(absoluteUrl: string, alt: string, background: string): SeoImage {
  const url = new URL(absoluteUrl);
  if (url.hostname === IMAGEKIT_HOST) {
    const padding = imagekitColour(background);
    const fill = padding ? `,bg-${padding}` : "";
    url.searchParams.set(
      "tr",
      `w-${SHARE_IMAGE_WIDTH},h-${SHARE_IMAGE_HEIGHT},cm-pad_resize${fill},f-jpg`
    );
    return {
      url: url.toString(),
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      type: "image/jpeg",
      alt,
    };
  }
  return {
    url: absoluteUrl,
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    type: mimeOf(url),
    alt,
  };
}
