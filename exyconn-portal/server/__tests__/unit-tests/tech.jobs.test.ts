import {
  backgroundJobs,
  clearBackgroundJobs,
  describeBackgroundJobs,
  findBackgroundJob,
  registerBackgroundJob,
} from '../../src/modules/tech/jobs.registry';
import { clearJobRuns, recordJobRun } from '../../src/utils/jobHeartbeat';
import { useTestOrganization } from '../helpers';

// Importing the server's loops registers them, the way the running server does.
import '../../src/modules/reminders/reminders.sweep';
import '../../src/modules/finance/finance.overdue';
import '../../src/modules/integrations/webhook.dispatch';
import '../../src/modules/ai/ai.worker';

const registered = [...backgroundJobs()];

function restoreRealJobs() {
  clearBackgroundJobs();
  for (const job of registered) {
    registerBackgroundJob(job);
  }
}

/**
 * Eleven loops carry the parts of this portal nobody is watching, and there was no way to act
 * on one: a digest that did not go out meant waiting an hour to find out whether it ever would.
 */
describe('the background job console', () => {
  useTestOrganization();
  afterEach(() => {
    restoreRealJobs();
    clearJobRuns();
  });

  it('lists the loops the server actually runs', () => {
    const keys = describeBackgroundJobs().map((job) => job.key);

    expect(keys).toContain('reminders');
    expect(keys).toContain('overdueInvoices');
    expect(keys).toContain('webhookDelivery');
    expect(keys).toContain('aiQueue');
  });

  it('describes every one of them, since the description is what the button is judged on', () => {
    for (const job of describeBackgroundJobs()) {
      expect(job.label.length).toBeGreaterThan(3);
      expect(job.description.length).toBeGreaterThan(10);
    }
  });

  it('says "not since restart" until a loop has ticked, then carries its heartbeat', () => {
    const before = describeBackgroundJobs().find((job) => job.key === 'reminders');
    expect(before).toMatchObject({ lastRunAt: null, lastRunSummary: '' });

    recordJobRun('reminders', '3 reminder(s) sent, 0 source(s) failed');
    const after = describeBackgroundJobs().find((job) => job.key === 'reminders');

    expect(after?.lastRunAt).toBeInstanceOf(Date);
    expect(after?.lastRunSummary).toContain('3 reminder(s) sent');
  });

  it('hands back the pass the timer would have taken', async () => {
    let passes = 0;
    clearBackgroundJobs();
    registerBackgroundJob({
      key: 'reminders',
      label: 'Test loop',
      description: 'Counts how many times it was asked to run.',
      runOnce: async () => {
        passes += 1;
      },
    });

    await findBackgroundJob('reminders')?.runOnce();

    expect(passes).toBe(1);
  });

  it('finds nothing for a key nobody registered, rather than pretending', () => {
    expect(findBackgroundJob('not-a-job')).toBeUndefined();
  });

  it('refuses two loops under one key', () => {
    clearBackgroundJobs();
    const job = {
      key: 'reminders' as const,
      label: 'Twice',
      description: 'Registered twice on purpose.',
      runOnce: async () => undefined,
    };
    registerBackgroundJob(job);

    expect(() => registerBackgroundJob(job)).toThrow('reminders');
  });
});
