import { SupportStatus } from '@exyconn/shell/graphql/generated';

/** A ticket still needs someone once it is open or being worked on. */
export const OPEN_TICKET_STATUSES: ReadonlySet<string> = new Set([
  SupportStatus.Open,
  SupportStatus.InProgress,
]);
