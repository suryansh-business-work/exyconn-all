import { z } from 'zod';
import { CrmEmailDirection, type CrmEmailThreadPageInput } from '@exyconn/shell/graphql/generated';

/** "Recent mail" presets, in days; CUSTOM uses the two pickers and ANY has no date limit. */
export const PERIOD_DAYS = { LAST_7_DAYS: 7, LAST_30_DAYS: 30, LAST_90_DAYS: 90 } as const;
type PresetPeriod = keyof typeof PERIOD_DAYS;

export const PERIOD_OPTIONS = [
  { value: 'ANY', label: 'Any time' },
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 days' },
  { value: 'CUSTOM', label: 'Custom dates' },
] as const;

export const DIRECTION_OPTIONS = [
  { value: 'ANY', label: 'Sent and received' },
  { value: CrmEmailDirection.In, label: 'Received' },
  { value: CrmEmailDirection.Out, label: 'Sent' },
] as const;

const DAY_MS = 86_400_000;

export const emailThreadFiltersSchema = z
  .object({
    period: z.enum(['ANY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'CUSTOM']),
    /** Picked days as ISO strings (local midnight), '' when not set. */
    after: z.string(),
    before: z.string(),
    direction: z.enum(['ANY', CrmEmailDirection.In, CrmEmailDirection.Out]),
    /** One mailbox's account id; '' is every mailbox. */
    accountId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.period !== 'CUSTOM') {
      return;
    }
    if (!values.after && !values.before) {
      ctx.addIssue({ code: 'custom', path: ['after'], message: 'Pick a start or an end date' });
    }
    if (values.after && values.before && values.before < values.after) {
      ctx.addIssue({
        code: 'custom',
        path: ['before'],
        message: 'Pick an end on or after the start',
      });
    }
  });

export type EmailThreadFilters = z.infer<typeof emailThreadFiltersSchema>;

export const EMPTY_EMAIL_FILTERS: EmailThreadFilters = {
  period: 'ANY',
  after: '',
  before: '',
  direction: 'ANY',
  accountId: '',
};

/** How many filters are set, for the badge on the filter button. */
export function activeFilterCount(filters: EmailThreadFilters) {
  return [filters.period !== 'ANY', filters.direction !== 'ANY', filters.accountId !== ''].filter(
    Boolean,
  ).length;
}

/** The custom range: from the start day's midnight to the very end of the end day. */
function customRange(filters: EmailThreadFilters) {
  const before = filters.before ? new Date(new Date(filters.before).getTime() + DAY_MS - 1) : null;
  return { after: filters.after || null, before: before?.toISOString() ?? null };
}

/** The date range of the filters, as the page query takes it. */
function rangeOf(filters: EmailThreadFilters, now: number) {
  if (filters.period === 'CUSTOM') {
    return customRange(filters);
  }
  if (filters.period === 'ANY') {
    return { after: null, before: null };
  }
  const days = PERIOD_DAYS[filters.period satisfies PresetPeriod];
  return { after: new Date(now - days * DAY_MS).toISOString(), before: null };
}

/** The filter part of the page query's input. */
export function filterInput(
  filters: EmailThreadFilters,
  now: number,
): Pick<CrmEmailThreadPageInput, 'after' | 'before' | 'direction' | 'accountId'> {
  return {
    ...rangeOf(filters, now),
    direction: filters.direction === 'ANY' ? null : filters.direction,
    accountId: filters.accountId || null,
  };
}
