import { randomUUID } from 'node:crypto';
import type { PendingPush } from '@exyconn/wa-flow';
import {
  deliverReminders,
  startWhatsappReminders,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.reminders';
import { WhatsappChatModel } from '../../../../../src/modules/whatsapp-demo/channel/chat.model';
import { activeSender } from '../../../../../src/modules/whatsapp-demo/channel/channel.service';
import { converse } from '../../../../../src/modules/whatsapp-demo/channel/channel.conversation';
import * as organizationEach from '../../../../../src/modules/organizations/organization.each';
import { backgroundJobs } from '../../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../../src/utils/jobHeartbeat';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';

jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.service', () => ({
  activeSender: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.conversation', () => ({
  converse: jest.fn(),
}));

useTestOrganization();
const sender = { phoneNumberId: '1098765', accessToken: randomUUID() };
const push = (id: string, offsetMs: number): PendingPush => ({
  id,
  demoKey: 'salon',
  workflow: 'booking',
  node: 'remind',
  at: Date.now() + offsetMs,
});
const lastRun = () => readJobRuns().get(JOB_KEYS.whatsappReminders)?.summary;

/** What the real turn does with a delivered reminder: it leaves the queue. */
async function playedTurn(chat: { id: string }, input: Parameters<typeof converse>[1]) {
  if (input.kind === 'push') {
    await WhatsappChatModel.updateOne(
      { _id: chat.id },
      { $pull: { pending: { id: input.push.id } } },
    );
  }
}

beforeEach(() => {
  clearJobRuns();
  jest.mocked(activeSender).mockResolvedValue(sender);
  jest.mocked(converse).mockImplementation(playedTurn);
});

afterEach(() => jest.restoreAllMocks());

describe('deliverReminders', () => {
  it('plays every reminder now due in each chat, earliest first, and leaves later ones', async () => {
    const first = push('first', -3_000);
    const second = push('second', -2_000);
    const third = push('third', -1_000);
    const later = push('later', 60 * 60 * 1000);
    await WhatsappChatModel.create({
      waId: '911',
      pending: [second, later, first, third],
      nextDueAt: new Date(first.at),
    });

    await deliverReminders();

    const pushes = jest.mocked(converse).mock.calls.map(([, input]) => input);
    expect(pushes).toEqual([
      { kind: 'push', push: first },
      { kind: 'push', push: second },
      { kind: 'push', push: third },
    ]);
    expect(jest.mocked(converse).mock.calls[0][2]).toBe(sender);
    expect(lastRun()).toBe('Delivered 3 WhatsApp reminders');
    const stored = await WhatsappChatModel.findOne({ waId: '911' }).lean();
    expect(stored?.pending).toEqual([later]);
  });

  it('leaves chats whose next reminder is not due yet', async () => {
    await WhatsappChatModel.create({
      waId: '912',
      pending: [push('later', 60_000)],
      nextDueAt: new Date(Date.now() + 60_000),
    });

    await deliverReminders();

    expect(converse).not.toHaveBeenCalled();
    expect(lastRun()).toBe('Delivered 0 WhatsApp reminders');
  });

  it('stops at a chat that disappears while its reminders are delivered', async () => {
    await WhatsappChatModel.create({
      waId: '913',
      pending: [push('a', -2_000), push('b', -1_000)],
      nextDueAt: new Date(Date.now() - 2_000),
    });
    jest.mocked(converse).mockImplementation(async (chat) => {
      await WhatsappChatModel.deleteOne({ _id: chat.id });
    });

    await deliverReminders();

    expect(converse).toHaveBeenCalledTimes(1);
    expect(lastRun()).toBe('Delivered 1 WhatsApp reminders');
  });

  it('does nothing while the company has no switched-on number', async () => {
    jest.mocked(activeSender).mockResolvedValue(null);
    await WhatsappChatModel.create({
      waId: '914',
      pending: [push('a', -1_000)],
      nextDueAt: new Date(Date.now() - 1_000),
    });

    await deliverReminders();

    expect(converse).not.toHaveBeenCalled();
    expect(lastRun()).toBeUndefined();
  });

  it('still delivers when run across the platform rather than one company', async () => {
    await runAsPlatform(() =>
      WhatsappChatModel.create({
        waId: '915',
        pending: [push('a', -1_000)],
        nextDueAt: new Date(Date.now() - 1_000),
      }),
    );

    await runAsPlatform(() => deliverReminders());

    expect(converse).toHaveBeenCalledTimes(1);
  });
});

describe('startWhatsappReminders', () => {
  function start() {
    const unref = jest.fn();
    let tick: () => void = () => undefined;
    const timer = jest.spyOn(globalThis, 'setInterval').mockImplementation(((fn: () => void) => {
      tick = fn;
      return { unref };
    }) as never);
    startWhatsappReminders();
    const interval = timer.mock.calls[0]?.[1];
    timer.mockRestore();
    return { tick, unref, interval };
  }

  it('ticks every thirty seconds without keeping the process alive', () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const passes = jest.spyOn(organizationEach, 'forEachOrganization').mockResolvedValue(undefined);

    const { tick, unref, interval } = start();
    tick();

    expect(interval).toBe(30_000);
    expect(unref).toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('WhatsApp reminders started');
    expect(passes).toHaveBeenCalledWith(deliverReminders, 'WhatsApp reminders');
  });

  it('logs a pass that fails instead of stopping the loop', async () => {
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const failure = new Error('db down');
    jest.spyOn(organizationEach, 'forEachOrganization').mockRejectedValue(failure);

    start().tick();
    await new Promise((resolve) => setImmediate(resolve));

    expect(logged).toHaveBeenCalledWith(failure, 'WhatsApp reminder pass failed');
  });

  it('is registered as a background job whose Run now takes the same pass', () => {
    const job = backgroundJobs().find((j) => j.key === JOB_KEYS.whatsappReminders);

    expect(job?.label).toBe('WhatsApp reminders');
    expect(job?.runOnce).toBe(deliverReminders);
  });
});
