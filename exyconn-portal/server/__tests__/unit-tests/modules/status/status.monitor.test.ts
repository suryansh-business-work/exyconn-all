import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { StatusDailyModel } from '../../../../src/modules/status/status-daily.model';
import { StatusIncidentModel } from '../../../../src/modules/status/status-incident.model';
import { announceIncident } from '../../../../src/modules/status/status.alerts';
import { dayKey, probe, runStatusChecks } from '../../../../src/modules/status/status.monitor';
import { safeFetch } from '../../../../src/utils/safeFetch';
import { env } from '../../../../src/config/env';

jest.mock('../../../../src/utils/safeFetch', () => ({ safeFetch: jest.fn() }));
jest.mock('../../../../src/modules/status/status.alerts', () => ({
  announceIncident: jest.fn(),
}));

const fetchMock = safeFetch as jest.Mock;
const announce = announceIncident as jest.Mock;
const defaultDegradedMs = env.status.degradedMs;

const monitor = {
  key: 'api',
  name: 'Portal API',
  category: 'API',
  url: 'https://api.example.test',
};

const answer = (status: number) => fetchMock.mockResolvedValue(new Response(null, { status }));

afterEach(() => {
  env.status.degradedMs = defaultDegradedMs;
  jest.restoreAllMocks();
});

describe('dayKey', () => {
  it('names the UTC calendar day of an instant', () => {
    expect(dayKey(new Date('2026-10-07T23:59:59.999Z'))).toBe('2026-10-07');
  });
});

describe('probe', () => {
  it('asks with the monitor user agent and the configured timeout', async () => {
    answer(200);

    const result = await probe('https://api.example.test/health');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/health',
      { headers: { 'user-agent': 'exyconn-status-monitor' } },
      { timeoutMs: env.status.timeoutMs },
    );
    expect(result).toMatchObject({ state: 'OPERATIONAL', httpStatus: 200, error: '' });
  });

  it('calls a slow but answering endpoint degraded', async () => {
    answer(200);
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000 + env.status.degradedMs + 1);

    const result = await probe('https://api.example.test');

    expect(result).toEqual({
      state: 'DEGRADED',
      responseMs: env.status.degradedMs + 1,
      httpStatus: 200,
      error: '',
    });
  });

  it('reports an error status as down with the code as the error', async () => {
    answer(404);

    expect(await probe('https://api.example.test')).toMatchObject({
      state: 'DOWN',
      httpStatus: 404,
      error: 'HTTP 404',
    });
  });

  it('turns a thrown error into a down result instead of throwing', async () => {
    fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));

    expect(await probe('https://api.example.test')).toMatchObject({
      state: 'DOWN',
      httpStatus: 0,
      error: 'The operation was aborted due to timeout',
    });
  });

  it('names a failure that is not an Error generically', async () => {
    fetchMock.mockRejectedValue('socket hang up');

    expect((await probe('https://api.example.test')).error).toBe('Request failed');
  });
});

describe('runStatusChecks', () => {
  beforeEach(() => StatusMonitorModel.create(monitor));

  it('counts a slow round as degraded and closes the open incident', async () => {
    env.status.degradedMs = -1;
    await StatusIncidentModel.create({
      serviceKey: 'api',
      serviceName: 'Portal API',
      startedAt: new Date(),
    });
    answer(200);

    await expect(runStatusChecks()).resolves.toBe(1);

    const saved = await StatusMonitorModel.findOne({ key: 'api' }).lean();
    expect(saved).toMatchObject({ state: 'DEGRADED', consecutiveFailures: 0, lastHttpStatus: 200 });
    const day = await StatusDailyModel.findOne({ serviceKey: 'api' }).lean();
    expect(day).toMatchObject({ checks: 1, failures: 0, degraded: 1 });
    const incident = await StatusIncidentModel.findOne({ serviceKey: 'api' }).lean();
    expect(incident?.resolvedAt).toBeInstanceOf(Date);
    expect(incident?.updates.map((update) => update.status)).toEqual(['RESOLVED']);
    expect(announce).toHaveBeenCalledWith(
      'RESOLVED',
      expect.objectContaining({ key: 'api', name: 'Portal API' }),
      '',
    );
  });

  it('says "no response" when a failure carries no message', async () => {
    fetchMock.mockRejectedValue(new Error(''));

    await runStatusChecks();
    await runStatusChecks();

    const incident = await StatusIncidentModel.findOne({ serviceKey: 'api' }).lean();
    expect(incident).toMatchObject({ reason: '', title: 'Portal API is down', impact: 'MAJOR' });
    expect(incident?.updates[0].body).toBe('Failed checks: no response');
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(
      'OPENED',
      expect.objectContaining({ key: 'api', url: 'https://api.example.test' }),
      '',
    );
  });

  it('skips a deactivated monitor', async () => {
    await StatusMonitorModel.updateOne({ key: 'api' }, { isActive: false });
    answer(200);

    await expect(runStatusChecks()).resolves.toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens nothing for a monitor deleted while it was being probed', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    jest.spyOn(StatusMonitorModel, 'findOneAndUpdate').mockReturnValue({
      select: () => ({ lean: () => Promise.resolve(null) }),
    } as never);

    await expect(runStatusChecks()).resolves.toBe(1);

    expect(await StatusIncidentModel.countDocuments()).toBe(0);
    expect(announce).not.toHaveBeenCalled();
    const day = await StatusDailyModel.findOne({ serviceKey: 'api' }).lean();
    expect(day).toMatchObject({ checks: 1, failures: 1 });
  });
});
