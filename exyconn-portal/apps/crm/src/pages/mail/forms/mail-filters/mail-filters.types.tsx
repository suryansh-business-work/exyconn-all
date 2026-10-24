import { z } from 'zod';
import type { CrmMailThreadsInput } from '@exyconn/shell/graphql/generated';
import { ANY_PERIOD, periodRange, periodShape, refinePeriod } from '../../../../mail-filters';

export const mailFiltersSchema = z
  .object({
    ...periodShape,
    /** Only conversations with unread mail. */
    unreadOnly: z.boolean(),
    /** Only conversations with files attached. */
    withAttachments: z.boolean(),
  })
  .superRefine(refinePeriod);

export type MailFilters = z.infer<typeof mailFiltersSchema>;

export const EMPTY_MAIL_FILTERS: MailFilters = {
  ...ANY_PERIOD,
  unreadOnly: false,
  withAttachments: false,
};

/** How many filters are set, for the badge on the filter icon. */
export const mailFilterCount = (filters: MailFilters) =>
  [filters.period !== 'ANY', filters.unreadOnly, filters.withAttachments].filter(Boolean).length;

/** The filter part of the list query's input. */
export function mailFilterInput(
  filters: MailFilters,
  now: number,
): Pick<CrmMailThreadsInput, 'after' | 'before' | 'unreadOnly' | 'withAttachments'> {
  return {
    ...periodRange(filters, now),
    unreadOnly: filters.unreadOnly || null,
    withAttachments: filters.withAttachments || null,
  };
}
