import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { startStatusMonitor } from '../../../../src/modules/status/status.monitor';
import { backgroundJobs } from '../../../../src/modules/tech/jobs.registry';
import { readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { safeFetch } from '../../../../src/utils/safeFetch';
import { logger } from '../../../../src/utils/logger';
import { env } from '../../../../src/config/env';

jest.mock('../../../../src/utils/safeFetch', () => ({ safeFetch: jest.fn() }));
jest.mock('../../../../src/modules/status/status.alerts', () => ({
  announceIncident: jest.fn(),
}));

const fetchMock = safeFetch as jest.Mock;
const defaultEnabled = env.status.enabled;

/** Watches the interval the loop schedules (calling through), so a test can inspect and stop it. */
function watchIntervals() {
  return jest.spyOn(globalThis, 'setInterval');
}

/** The handle of the loop's own interval among whatever else was scheduled. */
function loopInterval(scheduled: ReturnType<typeof watchIntervals>) {
  const index = scheduled.mock.calls.findIndex(([, delay]) => delay === env.status.intervalMs);
  return index === -1 ? undefined : (scheduled.mock.results[index].value as NodeJS.Timeout);
}

/** Resolves with the first message the given logger level receives. */
function nextLog(level: 'debug' | 'error') {
  return new Promise<unknown[]>((resolve) => {
    jest.spyOn(logger, level).mockImplementation(((...args: unknown[]) => {
      resolve(args);
    }) as never);
  });
}

beforeEach(() => {
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  env.status.enabled = defaultEnabled;
  jest.restoreAllMocks();
});

describe('startStatusMonitor', () => {
  it('does nothing but say so when the monitor is switched off', () => {
    env.status.enabled = false;
    const info = jest.spyOn(logger, 'info').mockImplementation((() => undefined) as never);
    const scheduled = watchIntervals();

    startStatusMonitor();

    expect(loopInterval(scheduled)).toBeUndefined();
    expect(info).toHaveBeenCalledWith('Status monitor disabled (STATUS_MONITOR_ENABLED=false)');
  });

  it('runs a round at once and then on the configured interval, without holding the process', async () => {
    env.status.enabled = true;
    await StatusMonitorModel.create({
      key: 'api',
      name: 'Portal API',
      category: 'API',
      url: 'https://api.example.test',
    });
    jest.spyOn(logger, 'info').mockImplementation((() => undefined) as never);
    const scheduled = watchIntervals();
    const logged = nextLog('debug');

    startStatusMonitor();
    const handle = loopInterval(scheduled);
    const holdsProcess = handle?.hasRef();
    clearInterval(handle);

    await expect(logged).resolves.toEqual(['Status monitor checked 1 services']);
    expect(holdsProcess).toBe(false);
    const saved = await StatusMonitorModel.findOne({ key: 'api' }).lean();
    expect(saved?.state).toBe('OPERATIONAL');
  });

  it('logs a failed round instead of letting it escape', async () => {
    env.status.enabled = true;
    jest.spyOn(logger, 'info').mockImplementation((() => undefined) as never);
    const scheduled = watchIntervals();
    const failure = new Error('database unavailable');
    jest.spyOn(StatusMonitorModel, 'find').mockImplementation(() => {
      throw failure;
    });
    const logged = nextLog('error');

    startStatusMonitor();
    clearInterval(loopInterval(scheduled));

    await expect(logged).resolves.toEqual([failure, 'Status monitor round failed']);
  });
});

describe('Status monitor background job', () => {
  it('is registered so Tech can run one round on demand', async () => {
    const job = backgroundJobs().find((entry) => entry.key === 'statusMonitor');
    expect(job?.label).toBe('Status page monitor');

    await expect(job?.runOnce()).resolves.toBe(0);
    expect(readJobRuns().get('statusMonitor')?.summary).toBe('Probed 0 services');
  });
});
