import { randomUUID } from 'node:crypto';
import { forEachOrganization } from '../../../../src/modules/organizations';
import { InboundMailConfigModel } from '../../../../src/modules/tech/inbound-mail-config.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { pollOnce, startInboundMail } from '../../../../src/modules/support/inbound-mail';
import { inboundMailbox, type InboundMessage } from '../../../../src/utils/inboundMail';
import { readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { asArg } from '../../../mockAs';

jest.mock('../../../../src/modules/organizations', () => ({ forEachOrganization: jest.fn() }));
jest.mock('../../../../src/utils/imagekit', () => ({ imageUploader: { uploadImage: jest.fn() } }));

const eachOrganization = jest.mocked(forEachOrganization);
const realSetTimeout = globalThis.setTimeout;

interface Scheduled {
  run: () => void;
  ms: number;
  unref: jest.Mock;
}

/**
 * Captures the poller's own timers (picked out by delay); every other timer runs for real.
 * Each test restores the real timer as soon as it has what it needs, so nothing else ever
 * waits on a captured callback.
 */
function captureTimers(delays: ReadonlySet<number>) {
  const scheduled: Scheduled[] = [];
  const fake = (run: () => void, ms = 0, ...args: unknown[]) => {
    if (!delays.has(ms)) {
      return (realSetTimeout as (...params: unknown[]) => unknown)(run, ms, ...args);
    }
    const unref = jest.fn();
    scheduled.push({ run, ms, unref });
    return { unref };
  };
  const spy = jest
    .spyOn(globalThis, 'setTimeout')
    .mockImplementation(fake as unknown as typeof setTimeout);
  return { scheduled, restore: () => spy.mockRestore() };
}

async function until(check: () => boolean): Promise<void> {
  for (let tick = 0; tick < 100 && !check(); tick += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

const config = (pollSeconds: number) => ({
  label: 'Support',
  host: 'imap.test',
  user: 'help@exyconn.com',
  password: randomUUID(),
  isActive: true,
  pollSeconds,
});

/** Stands in for `InboundMailConfigModel.findOne(...).lean()`, one company per call. */
function configsInTurn(...rows: Array<ReturnType<typeof config> | null>) {
  const findOne = jest.spyOn(InboundMailConfigModel, 'findOne');
  for (const row of rows) {
    findOne.mockReturnValueOnce(asArg({ lean: () => Promise.resolve(row) }));
  }
}

const summary = () => readJobRuns().get('inboundMail')?.summary;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('pollOnce', () => {
  it('stands down at the default interval when no mailbox is configured', async () => {
    const importAll = jest.spyOn(inboundMailbox, 'importAll');

    await expect(findBackgroundJob('inboundMail')?.runOnce()).resolves.toBe(120);

    expect(importAll).not.toHaveBeenCalled();
    expect(summary()).toBe('No mailbox configured');
  });

  it('reads the active mailbox, reports the tally and waits as long as the config asks', async () => {
    await InboundMailConfigModel.create(config(45));
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const autoReply: InboundMessage = {
      from: 'dana@acme.test',
      fromName: 'Dana',
      subject: 'Out of office',
      body: 'Away',
      inReplyTo: '',
      references: '',
      autoSubmitted: 'auto-replied',
      autoReply: true,
      attachments: [],
    };
    const importAll = jest
      .spyOn(inboundMailbox, 'importAll')
      .mockImplementation(async (_config, handle) => {
        await handle(autoReply);
        return { imported: 2, failed: 1 };
      });

    await expect(pollOnce()).resolves.toBe(45);

    expect(importAll).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'imap.test', mailbox: 'INBOX' }),
      expect.any(Function),
    );
    expect(summary()).toBe('Imported 2, failed 1');
    expect(info).toHaveBeenCalledWith('Inbound mail from "dana@acme.test": IGNORED');
  });
});

describe('startInboundMail', () => {
  it('runs the first round straight away without holding the process open', () => {
    const { scheduled, restore } = captureTimers(new Set([0]));

    startInboundMail();
    restore();

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].unref).toHaveBeenCalled();
  });

  it('polls every company and schedules the next round at the soonest interval asked for', async () => {
    const { scheduled, restore } = captureTimers(new Set([0, 45_000, 120_000]));
    eachOrganization.mockImplementation(async (work) => {
      await work();
      await work();
    });
    configsInTurn(config(300), config(45));
    jest.spyOn(inboundMailbox, 'importAll').mockResolvedValue({ imported: 0, failed: 0 });

    startInboundMail();
    scheduled[0].run();
    await until(() => scheduled.length > 1);
    restore();

    expect(eachOrganization).toHaveBeenCalledWith(expect.any(Function), 'Inbound support mail');
    expect(scheduled[1].ms).toBe(45_000);
  });

  it('never waits longer than the default, however slowly every company polls', async () => {
    const { scheduled, restore } = captureTimers(new Set([0, 120_000]));
    eachOrganization.mockImplementation(async (work) => {
      await work();
    });
    configsInTurn(config(300));
    jest.spyOn(inboundMailbox, 'importAll').mockResolvedValue({ imported: 0, failed: 0 });

    startInboundMail();
    scheduled[0].run();
    await until(() => scheduled.length > 1);
    restore();

    expect(scheduled[1].ms).toBe(120_000);
  });

  it('logs a round that fails instead of crashing the process', async () => {
    const { scheduled, restore } = captureTimers(new Set([0]));
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    eachOrganization.mockRejectedValue(new Error('database unreachable'));

    startInboundMail();
    scheduled[0].run();
    await until(() => error.mock.calls.length > 0);
    restore();

    expect(error).toHaveBeenCalledWith(expect.any(Error), 'Inbound mail round failed');
  });
});
