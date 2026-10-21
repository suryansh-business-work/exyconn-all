/** Bytes per `String.fromCodePoint` call — well under every engine's argument limit. */
const SLICE = 0x8000;

/**
 * Binary to base64, for carrying audio over `chrome.runtime` messaging, which accepts only
 * JSON-serialisable values (a Blob would arrive as `{}`).
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += SLICE) {
    binary += String.fromCodePoint(...bytes.subarray(offset, offset + SLICE));
  }
  return btoa(binary);
}

/** The inverse of `bytesToBase64`. `atob` yields bytes 0–255, so each code point is one byte. */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = Number(binary.codePointAt(index));
  }
  return bytes;
}

/** URL-safe base64 without padding (RFC 4648 §5), as PKCE and OAuth `state` use. */
export function base64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** The number of bytes a base64 string decodes to, without decoding it. */
export function base64DecodedLength(base64: string): number {
  let padding = 0;
  if (base64.endsWith('==')) {
    padding = 2;
  } else if (base64.endsWith('=')) {
    padding = 1;
  }
  return Math.floor((base64.length * 3) / 4) - padding;
}
