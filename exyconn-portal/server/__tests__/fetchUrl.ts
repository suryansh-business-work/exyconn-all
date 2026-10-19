/** The URL a faked `fetch` was called with, whichever form the caller passed it in. */
export function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}
