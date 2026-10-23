/** Marks a portal address as the way back from connecting one of the person's own mailboxes. */
export const MY_MAILBOX_PARAM = 'myMailbox';

/** What the OAuth callbacks add to the address they return to. */
export const CONNECT_RESULT_PARAMS = [
  'gmailConnected',
  'gmailError',
  'microsoftConnected',
  'microsoftError',
] as const;

/** The page the person is on, marked so the result is announced when they come back to it. */
export function mailboxReturnUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set(MY_MAILBOX_PARAM, '1');
  return url.toString();
}

export interface ConnectResult {
  /** The address connected, or the provider's reason it was not. */
  text: string;
  failed: boolean;
}

/** The outcome in a returned address's query, or null when it is not a personal connect. */
export function connectResultOf(search: URLSearchParams): ConnectResult | null {
  if (!search.has(MY_MAILBOX_PARAM)) {
    return null;
  }
  const name = CONNECT_RESULT_PARAMS.find((param) => search.has(param));
  if (!name) {
    return null;
  }
  return { text: search.get(name) ?? '', failed: name.endsWith('Error') };
}
