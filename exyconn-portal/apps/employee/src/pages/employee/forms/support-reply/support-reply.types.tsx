import type { MySupportRepliesQuery } from '@exyconn/shell/graphql/generated';

/** One public message on the employee's own ticket. */
export type SupportReplyRow = MySupportRepliesQuery['mySupportReplies'][number];

/** Form values for an employee replying on their own ticket. */
export interface SupportReplyFormValues {
  body: string;
}
