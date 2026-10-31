import { describe, expect, it } from 'vitest';
import { PlanInterval, Role, SubscriptionStatus } from '@exyconn/shell/graphql/generated';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  intervalLabel,
  modulesLabel,
  seatsLabel,
} from '../../../../src/pages/billing/plan.facts';
import { plan } from './billing.fixtures';

/** English pass-through with the placeholders filled, as `t` renders untranslated text. */
const t = (text: string, values: Record<string, string | number> = {}) =>
  text.replaceAll(/\{(\w+)\}/g, (_match, key: string) => String(values[key]));

describe('plan facts', () => {
  it('says how many people a plan seats, with 0 as unlimited', () => {
    expect(seatsLabel(0, t)).toBe('Unlimited people');
    expect(seatsLabel(1, t)).toBe('Up to 1 people');
    expect(seatsLabel(25, t)).toBe('Up to 25 people');
  });

  it('names the modules a plan opens', () => {
    expect(modulesLabel(plan({ allModules: true, modules: [Role.Crm] }), t)).toBe('Every module');
    expect(modulesLabel(plan({ modules: [] }), t)).toBe('Admin and My Workspace only');
    expect(modulesLabel(plan({ modules: [Role.Crm, Role.Hr] }), t)).toBe('CRM, HR');
  });

  it('names the billing interval', () => {
    expect(intervalLabel(PlanInterval.Month, t)).toBe('per month');
    expect(intervalLabel(PlanInterval.Year, t)).toBe('per year');
  });

  it('labels and colours every subscription status', () => {
    expect(Object.keys(STATUS_LABELS).sort((a, b) => a.localeCompare(b))).toEqual(
      Object.values(SubscriptionStatus).sort((a, b) => a.localeCompare(b)),
    );
    expect(STATUS_LABELS[SubscriptionStatus.PastDue]).toBe('Payment overdue');
    expect(STATUS_COLORS[SubscriptionStatus.Cancelled]).toBe('error');
    expect(STATUS_COLORS[SubscriptionStatus.Active]).toBe('success');
  });
});
