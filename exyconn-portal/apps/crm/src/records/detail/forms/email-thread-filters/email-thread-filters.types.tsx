import { z } from 'zod';
import { CrmEmailDirection, type CrmEmailThreadPageInput } from '@exyconn/shell/graphql/generated';
import { ANY_PERIOD, periodRange, periodShape, refinePeriod } from '../../../../mail-filters';

export const DIRECTION_OPTIONS = [
  { value: 'ANY', label: 'Sent and received' },
  { value: CrmEmailDirection.In, label: 'Received' },
  { value: CrmEmailDirection.Out, label: 'Sent' },
] as const;

export const emailThreadFiltersSchema = z
  .object({
    ...periodShape,
    direction: z.enum(['ANY', CrmEmailDirection.In, CrmEmailDirection.Out]),
    /** One mailbox's account id; '' is every mailbox. */
    accountId: z.string(),
  })
  .superRefine(refinePeriod);

export type EmailThreadFilters = z.infer<typeof emailThreadFiltersSchema>;

export const EMPTY_EMAIL_FILTERS: EmailThreadFilters = {
  ...ANY_PERIOD,
  direction: 'ANY',
  accountId: '',
};

/** How many filters are set, for the badge on the filter button. */
export function activeFilterCount(filters: EmailThreadFilters) {
  return [filters.period !== 'ANY', filters.direction !== 'ANY', filters.accountId !== ''].filter(
    Boolean,
  ).length;
}

/** The filter part of the page query's input. */
export function filterInput(
  filters: EmailThreadFilters,
  now: number,
): Pick<CrmEmailThreadPageInput, 'after' | 'before' | 'direction' | 'accountId'> {
  return {
    ...periodRange(filters, now),
    direction: filters.direction === 'ANY' ? null : filters.direction,
    accountId: filters.accountId || null,
  };
}
