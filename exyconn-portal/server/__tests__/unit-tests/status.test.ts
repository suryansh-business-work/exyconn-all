import { StatusMonitorModel } from '../../src/modules/status/status-monitor.model';
import { StatusDailyModel } from '../../src/modules/status/status-daily.model';
import { StatusIncidentModel } from '../../src/modules/status/status-incident.model';
import { ProblemReportModel } from '../../src/modules/status/problem-report.model';
import { resetReportLimits } from '../../src/modules/status/report-rate-limit';
import {
  dayKeysBack,
  ensureStatusMonitors,
  getStatusOverview,
  runStatusChecks,
  submitProblemReport,
} from '../../src/modules/status';

const monitor = {
  key: 'website',
  name: 'Website',
  description: 'The public site',
  category: 'WEBSITE',
  url: 'https://example.test',
  order: 0,
};

const report = {
  serviceKey: 'website',
  category: 'OUTAGE',
  severity: 'HIGH',
  subject: 'The site will not load',
  description: 'Opening the home page returns a blank screen on Chrome and Safari.',
  reporterName: 'Asha Rao',
  reporterEmail: 'asha@example.com',
  pageUrl: 'https://exyconn.com',
};

/** Replaces the network for one probe round. */
function mockFetch(response: { ok: boolean; status: number }) {
  globalThis.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('Status catalogue', () => {
  beforeAll(() => StatusMonitorModel.init());

  it('seeds every monitored surface once', async () => {
    const first = await ensureStatusMonitors();
    const second = await ensureStatusMonitors();

    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
    expect(await StatusMonitorModel.countDocuments()).toBe(first);
  });

  it('leaves an edited monitor alone on the next boot', async () => {
    await ensureStatusMonitors();
    await StatusMonitorModel.updateOne({ key: 'website' }, { name: 'Marketing site', isActive: false });

    await ensureStatusMonitors();

    const saved = await StatusMonitorModel.findOne({ key: 'website' }).lean();
    expect(saved?.name).toBe('Marketing site');
    expect(saved?.isActive).toBe(false);
  });
});

describe('Status overview', () => {
  it('reports uptime and latency per day from the rollups', async () => {
    await StatusMonitorModel.create(monitor);
    const [yesterday, today] = dayKeysBack(2);
    await StatusDailyModel.create([
      { serviceKey: 'website', date: yesterday, checks: 10, failures: 1, totalResponseMs: 2000 },
      { serviceKey: 'website', date: today, checks: 4, failures: 0, totalResponseMs: 800 },
    ]);

    const overview = await getStatusOverview(2);

    const [service] = overview.services;
    expect(service.days.map((d) => d.uptimePercent)).toEqual([90, 100]);
    expect(service.days.map((d) => d.avgResponseMs)).toEqual([200, 200]);
    expect(service.uptimeToday).toBe(100);
    expect(overview.uptime30d).toBe(92.9);
  });

  it('marks a day nobody measured as having no checks', async () => {
    await StatusMonitorModel.create(monitor);

    const overview = await getStatusOverview(3);

    expect(overview.services[0].days).toHaveLength(3);
    expect(overview.services[0].days.every((d) => d.checks === 0)).toBe(true);
    expect(overview.state).toBe('UNKNOWN');
  });

  it('headlines the worst state among the services', async () => {
    await StatusMonitorModel.create([
      { ...monitor, state: 'OPERATIONAL' },
      { ...monitor, key: 'api', name: 'API', order: 1, state: 'DOWN' },
    ]);

    expect((await getStatusOverview(1)).state).toBe('DOWN');
  });

  it('hides a deactivated monitor from the public page', async () => {
    await StatusMonitorModel.create({ ...monitor, isActive: false });

    expect((await getStatusOverview(1)).services).toHaveLength(0);
  });
});

describe('Status monitor round', () => {
  it('records a healthy check and closes any open incident', async () => {
    await StatusMonitorModel.create(monitor);
    await StatusIncidentModel.create({
      serviceKey: 'website',
      serviceName: 'Website',
      state: 'DOWN',
      startedAt: new Date(),
    });
    mockFetch({ ok: true, status: 200 });

    await runStatusChecks();

    const saved = await StatusMonitorModel.findOne({ key: 'website' }).lean();
    expect(saved?.state).toBe('OPERATIONAL');
    const day = await StatusDailyModel.findOne({ serviceKey: 'website' }).lean();
    expect(day).toMatchObject({ checks: 1, failures: 0 });
    const incident = await StatusIncidentModel.findOne({ serviceKey: 'website' }).lean();
    expect(incident?.resolvedAt).toBeInstanceOf(Date);
  });

  it('opens exactly one incident while a service stays down', async () => {
    await StatusMonitorModel.create(monitor);
    mockFetch({ ok: false, status: 502 });

    await runStatusChecks();
    await runStatusChecks();

    const saved = await StatusMonitorModel.findOne({ key: 'website' }).lean();
    expect(saved?.state).toBe('DOWN');
    expect(saved?.lastError).toBe('HTTP 502');
    expect(await StatusIncidentModel.countDocuments({ serviceKey: 'website' })).toBe(1);
    const day = await StatusDailyModel.findOne({ serviceKey: 'website' }).lean();
    expect(day).toMatchObject({ checks: 2, failures: 2 });
  });

  it('treats an unreachable host as down rather than throwing', async () => {
    await StatusMonitorModel.create(monitor);
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    await expect(runStatusChecks()).resolves.toBe(1);

    const saved = await StatusMonitorModel.findOne({ key: 'website' }).lean();
    expect(saved?.state).toBe('DOWN');
    expect(saved?.lastError).toContain('ENOTFOUND');
  });
});

describe('Problem reports', () => {
  beforeAll(() => ProblemReportModel.init());
  beforeEach(async () => {
    resetReportLimits();
    await StatusMonitorModel.create(monitor);
  });

  it('files a report with a quotable reference and the resolved service name', async () => {
    const receipt = await submitProblemReport(report);

    expect(receipt.reference).toMatch(/^EXY-[A-Z2-9]{6}$/);
    const saved = await ProblemReportModel.findOne({ reference: receipt.reference }).lean();
    expect(saved).toMatchObject({ serviceName: 'Website', status: 'NEW', severity: 'HIGH' });
  });

  it('normalises the reporter email so triage never sees two casings', async () => {
    const receipt = await submitProblemReport({ ...report, reporterEmail: '  Asha@Example.COM ' });

    const saved = await ProblemReportModel.findOne({ reference: receipt.reference }).lean();
    expect(saved?.reporterEmail).toBe('asha@example.com');
  });

  it('rejects an invalid email address', async () => {
    await expect(submitProblemReport({ ...report, reporterEmail: 'asha@' })).rejects.toThrow(
      'valid email',
    );
  });

  it('rejects a description too short to act on', async () => {
    await expect(submitProblemReport({ ...report, description: 'broken' })).rejects.toThrow(
      'at least 20 characters',
    );
  });

  it('rejects a service that is not in the catalogue', async () => {
    await expect(submitProblemReport({ ...report, serviceKey: 'ghost' })).rejects.toThrow(
      'Choose a service',
    );
  });

  it('accepts a platform-wide report with no service chosen', async () => {
    const receipt = await submitProblemReport({ ...report, serviceKey: '' });

    const saved = await ProblemReportModel.findOne({ reference: receipt.reference }).lean();
    expect(saved?.serviceName).toBe('');
  });

  it('stops one connection from flooding the queue', async () => {
    const send = (index: number) =>
      submitProblemReport({ ...report, subject: `Problem number ${index}` }, '203.0.113.10');
    for (let index = 0; index < 10; index += 1) {
      await send(index);
    }

    await expect(send(11)).rejects.toThrow('Too many reports');
    // A different caller is unaffected by someone else's burst.
    await expect(submitProblemReport(report, '203.0.113.11')).resolves.toBeTruthy();
  });
});
