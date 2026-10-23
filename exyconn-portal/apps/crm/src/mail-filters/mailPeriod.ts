import { z } from 'zod';

/**
 * "How recent" for an email list's filters, shared by CRM > Mail and a record's Emails tab:
 * a recent-mail preset, a custom range on the date pickers, or any time.
 */
export const PERIOD_DAYS = { LAST_7_DAYS: 7, LAST_30_DAYS: 30, LAST_90_DAYS: 90 } as const;
type PresetPeriod = keyof typeof PERIOD_DAYS;

export const PERIOD_OPTIONS = [
  { value: 'ANY', label: 'Any time' },
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 days' },
  { value: 'CUSTOM', label: 'Custom dates' },
] as const;

const DAY_MS = 86_400_000;

/** The period fields of a filter schema; `after`/`before` are picked days as ISO strings. */
export const periodShape = {
  period: z.enum(['ANY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'CUSTOM']),
  after: z.string(),
  before: z.string(),
};

export type PeriodValues = { [K in keyof typeof periodShape]: z.infer<(typeof periodShape)[K]> };

export const ANY_PERIOD: PeriodValues = { period: 'ANY', after: '', before: '' };

/** A custom range needs a date, and an end on or after its start. */
export function refinePeriod(values: PeriodValues, ctx: z.RefinementCtx) {
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
}

/**
 * The range as a query takes it: a preset counts back from `now`, a custom range runs from its
 * first day's midnight to the very end of its last day.
 */
export function periodRange(values: PeriodValues, now: number) {
  if (values.period === 'ANY') {
    return { after: null, before: null };
  }
  if (values.period === 'CUSTOM') {
    const end = values.before ? new Date(new Date(values.before).getTime() + DAY_MS - 1) : null;
    return { after: values.after || null, before: end?.toISOString() ?? null };
  }
  const days = PERIOD_DAYS[values.period satisfies PresetPeriod];
  return { after: new Date(now - days * DAY_MS).toISOString(), before: null };
}
