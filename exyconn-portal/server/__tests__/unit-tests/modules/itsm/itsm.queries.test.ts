import {
  ACTIVE_INCIDENT,
  daysAhead,
  endsWithin,
  IT_ANNOUNCEMENT,
  monthlyCostOf,
} from '../../../../src/modules/itsm/itsm.queries';
import { IT_INCIDENT_DONE } from '../../../../src/modules/itsm/itsm.enums';

const DAY = 86_400_000;

describe('shared IT query conditions', () => {
  it('counts days ahead from the instant given', () => {
    const now = Date.UTC(2026, 0, 1);

    expect(daysAhead(3, now).toISOString()).toBe('2026-01-04T00:00:00.000Z');
    expect(daysAhead(-1, now).toISOString()).toBe('2025-12-31T00:00:00.000Z');
  });

  it('defaults to now when no instant is given', () => {
    const before = Date.now();
    const ahead = daysAhead(1).getTime();

    expect(ahead).toBeGreaterThanOrEqual(before + DAY);
    expect(ahead).toBeLessThanOrEqual(Date.now() + DAY);
  });

  it('treats "ends within" as set and on or before the cut-off, overdue included', () => {
    const condition = endsWithin(10);

    expect(condition.$ne).toBeNull();
    expect(condition.$lte.getTime()).toBeGreaterThan(Date.now() + 9 * DAY);
    expect(condition).not.toHaveProperty('$gte');
  });

  it('normalises a licence to a monthly cost for every billing cycle', () => {
    expect(monthlyCostOf({ cost: 100, billingCycle: 'MONTHLY' })).toBe(100);
    expect(monthlyCostOf({ cost: 300, billingCycle: 'QUARTERLY' })).toBe(100);
    expect(monthlyCostOf({ cost: 1200, billingCycle: 'YEARLY' })).toBe(100);
  });

  it('reads an unknown billing cycle as yearly rather than overstating it', () => {
    expect(monthlyCostOf({ cost: 1200, billingCycle: 'BIENNIAL' })).toBe(100);
  });

  it('agrees with the enums on what an active incident and an IT announcement are', () => {
    expect(ACTIVE_INCIDENT.status.$nin).toEqual([...IT_INCIDENT_DONE]);
    expect(IT_INCIDENT_DONE.has('RESOLVED')).toBe(true);
    expect(IT_INCIDENT_DONE.has('MONITORING')).toBe(false);
    expect(IT_ANNOUNCEMENT.category.$in).toEqual(['MAINTENANCE', 'OUTAGE', 'SECURITY_ALERT']);
  });
});
