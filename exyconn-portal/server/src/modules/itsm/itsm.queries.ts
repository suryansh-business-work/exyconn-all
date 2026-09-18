import { ANNOUNCEMENT_IT_CATEGORIES } from '../announcements/announcement.model';
import { IT_INCIDENT_DONE } from './itsm.enums';

/**
 * Mongo conditions the IT screens share, so "open", "active" and "expiring" mean the same
 * thing on the dashboard, the reports and the profile.
 */
const MS_PER_DAY = 86_400_000;

/** IT's slice of the shared support queue. */
export const IT_TICKET = { category: 'IT' } as const;
export const OPEN_TICKET = { status: { $nin: ['RESOLVED', 'CLOSED'] } } as const;
export const ACTIVE_INCIDENT = { status: { $nin: [...IT_INCIDENT_DONE] } } as const;
export const OPEN_VULNERABILITY = { status: { $in: ['OPEN', 'IN_PROGRESS'] } } as const;
export const IT_ANNOUNCEMENT = { category: { $in: [...ANNOUNCEMENT_IT_CATEGORIES] } } as const;
/** An asset that is still in service, so its warranty still matters. */
export const IN_SERVICE_ASSET = { status: { $nin: ['RETIRED', 'LOST'] } } as const;

/** The instant `days` from now. */
export const daysAhead = (days: number, now = Date.now()): Date =>
  new Date(now + days * MS_PER_DAY);

/** A date field that is set and falls on or before `days` from now (overdue included). */
export const endsWithin = (days: number) => ({ $ne: null, $lte: daysAhead(days) });

/** A licence's cost per month, whatever cycle it is billed on. */
const MONTHS_PER_CYCLE: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 };
export const monthlyCostOf = (licence: { cost: number; billingCycle: string }): number =>
  licence.cost / (MONTHS_PER_CYCLE[licence.billingCycle] ?? 12);
