import { runAsPlatform } from '../../../../src/lib/tenant';
import { EmailVerificationBatchModel } from '../../../../src/modules/email-verification/email-verification.model';
import { createBatch } from '../../../../src/modules/email-verification/email-verification.service';
import {
  startEmailVerification,
  verifyQueuedEmails,
} from '../../../../src/modules/email-verification/email-verification.worker';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';
import { asArg } from '../../../mockAs';
import { fakeReacher } from './fakeReacher';

useTestOrganization();

const lastSummary = () => readJobRuns().get(JOB_KEYS.emailVerification)?.summary;

/** Waits, on real timers, until `check` holds: the interval's pass runs detached. */
async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The condition never held');
}

/** Captures the tick the worker schedules, so a test can fire it. */
function captureTick() {
  const unref = jest.fn();
  let tick: () => void = () => undefined;
  const interval = jest.spyOn(globalThis, 'setInterval').mockImplementation(
    asArg((handler: () => void) => {
      tick = handler;
      return { unref };
    }),
  );
  startEmailVerification();
  expect(interval).toHaveBeenCalledWith(expect.any(Function), 10_000);
  interval.mockRestore();
  expect(unref).toHaveBeenCalled();
  return tick;
}

beforeEach(() => clearJobRuns());
afterEach(() => jest.restoreAllMocks());

describe('the email verification worker', () => {
  it('takes one pass for the company in scope and reports how many it checked', async () => {
    fakeReacher();
    await createBatch('October', ['a@acme.test', 'b@acme.test'], 'Ravi');

    await verifyQueuedEmails();

    expect(lastSummary()).toBe('Checked 2 addresses from bulk uploads');
    const batch = await EmailVerificationBatchModel.findOne().lean();
    expect(batch?.status).toBe('DONE');
  });

  it('never overlaps a company pass that is still running', async () => {
    const calls = fakeReacher();
    await createBatch('October', ['a@acme.test'], 'Ravi');

    await Promise.all([verifyQueuedEmails(), verifyQueuedEmails()]);

    expect(calls).toHaveLength(1);
    // Once the pass is over the company can be checked again.
    await createBatch('November', ['b@acme.test'], 'Ravi');
    await verifyQueuedEmails();
    expect(calls).toHaveLength(2);
  });

  it('runs as the platform too, when no company is in scope', async () => {
    await runAsPlatform(() => verifyQueuedEmails());

    expect(lastSummary()).toBe('Checked 0 addresses from bulk uploads');
  });

  it('is a Run now job on the Tech jobs screen', () => {
    expect(findBackgroundJob(JOB_KEYS.emailVerification)).toMatchObject({
      label: 'Email verification',
      runOnce: verifyQueuedEmails,
    });
  });

  it('every tick takes a pass for each company', async () => {
    fakeReacher();
    await createBatch('October', ['a@acme.test'], 'Ravi');
    jest.spyOn(logger, 'info').mockImplementation(() => logger);

    captureTick()();

    await eventually(() => lastSummary() !== undefined);
    expect(lastSummary()).toBe('Checked 1 addresses from bulk uploads');
  });

  it('logs a tick that could not even list the companies', async () => {
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unreachable');
    });

    captureTick()();

    await eventually(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'Email verification pass failed');
    expect(lastSummary()).toBeUndefined();
  });
});
