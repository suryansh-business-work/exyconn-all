import type { GmailAccountStatus } from '@exyconn/shell/graphql/generated';

/** The mail providers a company can connect its mailboxes from. */
export type MailProvider = 'GMAIL' | 'MICROSOFT';

/** Which mailbox an action is for: its id with its provider, and its address for the confirmation. */
export interface MailboxRef {
  id: string;
  email: string;
}

/** One connected mailbox as a row of the mailboxes table, whichever provider it is from. */
export interface MailboxRow {
  /** Unique across providers: the provider and the account's id. */
  id: string;
  account: MailboxRef;
  provider: MailProvider;
  email: string;
  enabled: boolean;
  status: GmailAccountStatus;
  lastError: string;
  /** When `lastError` happened; null on a working mailbox or one saved before it was kept. */
  lastErrorAt: string | null;
  connectedByName: string;
  /** When Gmail last synced it, or when the CRM last sent from a Microsoft mailbox. */
  lastActivityAt: string | null;
}

/** What can be done with one provider's mailboxes. */
export interface MailboxActions {
  /** Opens the provider's sign-in; `loginHint` is the address being reconnected. */
  connect: (loginHint?: string) => Promise<void>;
  connecting: boolean;
  /** Checks the mailbox works right now and says how it went. */
  test: (account: MailboxRef) => Promise<void>;
  toggle: (account: MailboxRef, enabled: boolean) => Promise<void>;
  remove: (account: MailboxRef) => Promise<void>;
}

/** Each provider's actions, so a row reaches the ones for its own provider. */
export type MailboxActionsByProvider = Readonly<Record<MailProvider, MailboxActions>>;

/** The words each provider uses on the page, as English source strings. */
export interface MailProviderText {
  provider: MailProvider;
  connectLabel: string;
  loadError: string;
  /** Why Connect is off while the platform has not switched the provider on. */
  unavailable: string;
}

export const MAIL_PROVIDERS: readonly MailProviderText[] = [
  {
    provider: 'GMAIL',
    connectLabel: 'Connect Gmail',
    loadError: 'Could not load the Gmail accounts.',
    unavailable:
      'Google mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).',
  },
  {
    provider: 'MICROSOFT',
    connectLabel: 'Connect Microsoft',
    loadError: 'Could not load the Microsoft mailboxes.',
    unavailable:
      'Microsoft mailbox connections are not switched on yet. Ask your platform administrator to set them up in Tech > Environment Variables > Email accounts (OAuth).',
  },
];
