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

const RESULT_PARAMS: ReadonlySet<string> = new Set(CONNECT_RESULT_PARAMS);

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
  const outcome = [...search.entries()].find(([name]) => RESULT_PARAMS.has(name));
  if (!outcome) {
    return null;
  }
  const [name, text] = outcome;
  return { text, failed: name.endsWith('Error') };
}
