const WEB_PROTOCOLS = new Set(['http:', 'https:']);

/** Whether a value is an absolute web address (http or https) — the only kind an image is served from. */
export function isWebAddress(value: string): boolean {
  try {
    return WEB_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
