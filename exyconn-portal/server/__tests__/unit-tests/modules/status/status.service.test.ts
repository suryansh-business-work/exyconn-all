import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { StatusDailyModel } from '../../../../src/modules/status/status-daily.model';
import {
  dayKeysBack,
  getStatusOverview,
  publicServiceError,
  publicServiceUrl,
} from '../../../../src/modules/status/status.service';
import { env } from '../../../../src/config/env';

const monitor = {
  key: 'website',
  name: 'Website',
  category: 'WEBSITE',
  url: 'https://example.test',
  order: 0,
};

describe('publicServiceUrl', () => {
  it('keeps only the https origin, never the probed path or query', () => {
    expect(publicServiceUrl('https://api.example.test/internal/health?token=abc')).toBe(
      'https://api.example.test',
    );
  });

  it('hides a plain http monitor and anything that is not a URL', () => {
    expect(publicServiceUrl('http://api.example.test/health')).toBe('');
    expect(publicServiceUrl('not a url')).toBe('');
  });
});

describe('publicServiceError', () => {
  it('passes an empty error and an HTTP status through unchanged', () => {
    expect(publicServiceError('')).toBe('');
    expect(publicServiceError('HTTP 503')).toBe('HTTP 503');
  });

  it('reduces resolver and socket messages to "Unreachable"', () => {
    expect(publicServiceError('connect ECONNREFUSED 10.0.0.5:443')).toBe('Unreachable');
    expect(publicServiceError('HTTP 5030')).toBe('Unreachable');
  });
});

describe('dayKeysBack', () => {
  it('walks back across a month boundary, oldest first', () => {
    expect(dayKeysBack(3, new Date('2026-03-01T22:00:00Z'))).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });
});

describe('Status overview headline', () => {
  it('is UNKNOWN with nothing monitored', async () => {
    const overview = await getStatusOverview(1);

    expect(overview).toMatchObject({ state: 'UNKNOWN', total: 0, uptimeToday: 0 });
  });

  it('is DEGRADED when the worst service is slow, and counts each state', async () => {
    await StatusMonitorModel.create([
      { ...monitor, state: 'OPERATIONAL' },
      { ...monitor, key: 'api', name: 'API', order: 1, state: 'DEGRADED' },
    ]);

    const overview = await getStatusOverview(1);

    expect(overview).toMatchObject({
      state: 'DEGRADED',
      total: 2,
      operational: 1,
      degraded: 1,
      down: 0,
    });
  });

  it('is OPERATIONAL when every service answers', async () => {
    await StatusMonitorModel.create({ ...monitor, state: 'OPERATIONAL' });

    expect((await getStatusOverview(1)).state).toBe('OPERATIONAL');
  });

  it('reports the check interval in whole minutes, never below one', async () => {
    const overview = await getStatusOverview(1);

    expect(overview.checkIntervalMinutes).toBe(
      Math.max(1, Math.round(env.status.intervalMs / 60_000)),
    );
  });
});

describe('Status overview window', () => {
  beforeEach(() => StatusMonitorModel.create(monitor));

  it.each([
    [500, 90],
    [0, 1],
    [-4, 1],
    [2.9, 2],
    [null, 90],
    [undefined, 90],
  ])('asked for %p days, draws %p', async (asked, drawn) => {
    const overview = await getStatusOverview(asked);

    expect(overview.daily).toHaveLength(drawn);
    expect(overview.services[0].days).toHaveLength(drawn);
  });
});

describe('Status overview services', () => {
  it('shows the public origin and a sanitised error, never internal detail', async () => {
    await StatusMonitorModel.create({
      ...monitor,
      url: 'https://api.example.test/internal?token=x',
      state: 'DOWN',
      lastError: 'getaddrinfo ENOTFOUND api.internal',
    });

    const [service] = (await getStatusOverview(1)).services;

    expect(service.url).toBe('https://api.example.test');
    expect(service.lastError).toBe('Unreachable');
  });

  it('adds every service into the platform series and ignores rollups of unknown services', async () => {
    await StatusMonitorModel.create([monitor, { ...monitor, key: 'api', name: 'API', order: 1 }]);
    const [today] = dayKeysBack(1);
    await StatusDailyModel.create([
      { serviceKey: 'website', date: today, checks: 4, failures: 1, totalResponseMs: 800 },
      { serviceKey: 'api', date: today, checks: 1, failures: 0, totalResponseMs: 200 },
      { serviceKey: 'ghost', date: today, checks: 50, failures: 50, totalResponseMs: 9000 },
    ]);

    const overview = await getStatusOverview(1);

    expect(overview.daily[0]).toEqual({
      date: today,
      uptimePercent: 80,
      avgResponseMs: 200,
      checks: 5,
      failures: 1,
    });
    expect(overview.avgResponseMs).toBe(200);
    expect(overview.uptimeToday).toBe(80);
    expect(overview.services.map((service) => service.uptime30d)).toEqual([75, 100]);
  });
});
