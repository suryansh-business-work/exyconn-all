import type { CrmEmailThreadPageQuery } from '@exyconn/shell/graphql/generated';

/** One conversation in one connected mailbox, as the Emails tab lists it. */
export type EmailThread = CrmEmailThreadPageQuery['crmEmailThreadPage']['rows'][number];
export type EmailMessage = EmailThread['messages'][number];

/** A conversation's key: Gmail thread ids are per mailbox. */
export const threadKey = (thread: Pick<EmailThread, 'accountId' | 'threadId'>) =>
  `${thread.accountId}:${thread.threadId}`;
