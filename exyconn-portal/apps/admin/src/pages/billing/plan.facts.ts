import { roleList } from '@exyconn/shell/auth/roles';
import {
  PlanInterval,
  SubscriptionStatus,
  type BillingPlanFieldsFragment,
} from '@exyconn/shell/graphql/generated';

type Translate = (text: string, values?: Record<string, string | number>) => string;

/** A seat limit as a sentence; 0 is unlimited. */
export function seatsLabel(limit: number, t: Translate): string {
  return limit === 0 ? t('Unlimited people') : t('Up to {count} people', { count: limit });
}

/** The modules a plan opens, besides the Admin and My Workspace every plan has. */
export function modulesLabel(plan: BillingPlanFieldsFragment, t: Translate): string {
  if (plan.allModules) {
    return t('Every module');
  }
  if (plan.modules.length === 0) {
    return t('Admin and My Workspace only');
  }
  return roleList(plan.modules, t);
}

/** "per month" / "per year". */
export function intervalLabel(interval: PlanInterval, t: Translate): string {
  return interval === PlanInterval.Year ? t('per year') : t('per month');
}

/** Each status as the administrator reads it. */
export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.Trialing]: 'Free trial',
  [SubscriptionStatus.Active]: 'Active',
  [SubscriptionStatus.PastDue]: 'Payment overdue',
  [SubscriptionStatus.Cancelled]: 'Cancelled',
};

export const STATUS_COLORS: Record<SubscriptionStatus, 'info' | 'success' | 'warning' | 'error'> = {
  [SubscriptionStatus.Trialing]: 'info',
  [SubscriptionStatus.Active]: 'success',
  [SubscriptionStatus.PastDue]: 'warning',
  [SubscriptionStatus.Cancelled]: 'error',
};
