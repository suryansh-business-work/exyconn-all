import { TOOLS_FOLDER } from "../shared/services/imagekit";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface ImageType {
  mime: string;
  extension: string;
  matches: (bytes: Buffer) => boolean;
}

const startsWith = (bytes: Buffer, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

const ascii = (text: string) =>
  Array.from(text, (ch) => ch.codePointAt(0) ?? 0);

/** Raster formats only: an SVG can carry script, so it is never accepted. */
const IMAGE_TYPES: ImageType[] = [
  {
    mime: "image/png",
    extension: "png",
    matches: (b) =>
      startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mime: "image/jpeg",
    extension: "jpg",
    matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  {
    mime: "image/gif",
    extension: "gif",
    matches: (b) =>
      startsWith(b, ascii("GIF87a")) || startsWith(b, ascii("GIF89a")),
  },
  {
    mime: "image/webp",
    extension: "webp",
    matches: (b) =>
      startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
  },
];

/** The image type a file really is — its declared type AND its first bytes must agree. */
export function detectImageType(
  mime: string,
  bytes: Buffer,
): ImageType | undefined {
  return IMAGE_TYPES.find((type) => type.mime === mime && type.matches(bytes));
}

const MAX_FOLDER_DEPTH = 3;
const SEGMENT = /^[\w-]{1,40}$/;

/**
 * The folder a client asked for, confined under /tools: only plain name segments survive
 * (no "..", no absolute escape), so "/email-signatures/photos" becomes
 * "/tools/email-signatures/photos" and anything else collapses to "/tools".
 */
export function toolsFolder(requested: unknown): string {
  const segments =
    typeof requested === "string"
      ? requested
          .split("/")
          .filter(
            (segment) =>
              SEGMENT.test(segment) && segment !== TOOLS_FOLDER.slice(1),
          )
          .slice(0, MAX_FOLDER_DEPTH)
      : [];
  return [TOOLS_FOLDER, ...segments].join("/");
}

/** A safe file name with the extension of the detected type. */
export function safeFileName(requested: unknown, extension: string): string {
  const raw = typeof requested === "string" ? requested : "";
  const base = raw
    .replace(/\.[^.]*$/, "")
    .replaceAll(/[^\w-]/g, "_")
    .slice(0, 80);
  return `${base || "image"}.${extension}`;
}
