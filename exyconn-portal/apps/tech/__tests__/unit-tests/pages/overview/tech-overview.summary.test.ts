import { describe, expect, it } from 'vitest';
import {
  HEALTHY_STATE,
  OPEN_PROBLEM_STATUSES,
  OVERVIEW_DAYS,
  RECENT_SERVICES,
} from '../../../../src/pages/overview/tech-overview.constants';
import {
  openProblemReports,
  unhealthyServices,
  uptimeLabel,
} from '../../../../src/pages/overview/tech-overview.summary';

describe('tech overview constants', () => {
  it('looks back a week and lists eight services', () => {
    expect(OVERVIEW_DAYS).toBe(7);
    expect(RECENT_SERVICES).toBe(8);
  });

  it('counts new, triaged and in-progress reports as open, and only operational as healthy', () => {
    expect(OPEN_PROBLEM_STATUSES).toEqual(['NEW', 'TRIAGED', 'IN_PROGRESS']);
    expect(HEALTHY_STATE).toBe('OPERATIONAL');
  });
});

describe('openProblemReports', () => {
  it('is zero before the stats have answered', () => {
    expect(openProblemReports(null)).toBe(0);
    expect(openProblemReports(undefined)).toBe(0);
  });

  it('sums the open states and ignores resolved and closed reports', () => {
    const stats = {
      total: 20,
      counts: [
        {
          field: 'status',
          buckets: [
            { value: 'NEW', count: 3 },
            { value: 'TRIAGED', count: 2 },
            { value: 'IN_PROGRESS', count: 1 },
            { value: 'RESOLVED', count: 9 },
            { value: 'CLOSED', count: 5 },
          ],
        },
      ],
      sums: [],
    };

    expect(openProblemReports(stats)).toBe(6);
  });
});

describe('unhealthyServices', () => {
  it('keeps every service that is not operational, in order', () => {
    const services = [
      { id: 'a', state: 'OPERATIONAL' },
      { id: 'b', state: 'DOWN' },
      { id: 'c', state: 'DEGRADED' },
      { id: 'd', state: 'UNKNOWN' },
    ];

    expect(unhealthyServices(services).map((service) => service.id)).toEqual(['b', 'c', 'd']);
    expect(unhealthyServices([])).toEqual([]);
  });
});

describe('uptimeLabel', () => {
  it('writes uptime to one decimal place', () => {
    expect(uptimeLabel(99.96)).toBe('100.0%');
    expect(uptimeLabel(97.23)).toBe('97.2%');
    expect(uptimeLabel(0)).toBe('0.0%');
  });
});
