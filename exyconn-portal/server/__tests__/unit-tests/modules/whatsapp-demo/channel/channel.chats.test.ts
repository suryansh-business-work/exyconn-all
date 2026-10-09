import { Types } from 'mongoose';
import { toDemoBundle, type CatalogWarn } from '@exyconn/wa-flow';
import {
  claimMessage,
  nextDueAt,
  optionRegistry,
  publishedBundles,
  saveChat,
  toRecord,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';
import { WhatsappChatModel } from '../../../../../src/modules/whatsapp-demo/channel/chat.model';
import { catalog } from '../../../../../src/modules/whatsapp-demo/whatsappDemo.service';
import { logger } from '../../../../../src/utils/logger';
import { useTestOrganization } from '../../../../helpers';
import { demoBundle, option } from './channel.fixtures';
import { asArg } from '../../../../mockAs';

jest.mock('@exyconn/wa-flow', () => ({
  ...jest.requireActual('@exyconn/wa-flow'),
  toDemoBundle: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/whatsappDemo.service', () => ({
  catalog: jest.fn(),
}));

useTestOrganization();
const WA_ID = '919800000001';
const push = (id: string, at: number) => ({ id, demoKey: 'salon', workflow: 'w', node: 'n', at });

beforeAll(() => WhatsappChatModel.init());
afterEach(() => jest.restoreAllMocks());

describe('toRecord', () => {
  it('fills in what a freshly created chat has not stored yet', () => {
    const id = new Types.ObjectId();
    expect(toRecord({ _id: id, waId: WA_ID })).toEqual({
      id: String(id),
      waId: WA_ID,
      name: '',
      demoKey: null,
      state: null,
      options: {},
      pending: [],
      sessionId: null,
      lastEventAt: null,
    });
  });
});

describe('claimMessage', () => {
  it('creates the chat on a first message and remembers the message id', async () => {
    const chat = await claimMessage(WA_ID, 'Asha', 'wamid.1');

    expect(chat).toEqual(expect.objectContaining({ waId: WA_ID, name: 'Asha', demoKey: null }));
    const stored = await WhatsappChatModel.findOne({ waId: WA_ID }).lean();
    expect(stored?.seen).toEqual(['wamid.1']);
  });

  it('ignores a message Meta delivers a second time', async () => {
    await claimMessage(WA_ID, 'Asha', 'wamid.1');

    await expect(claimMessage(WA_ID, 'Asha', 'wamid.1')).resolves.toBeNull();
    expect(await WhatsappChatModel.countDocuments()).toBe(1);
  });

  it('keeps the chat for the next message, with the latest profile name', async () => {
    const first = await claimMessage(WA_ID, 'Asha', 'wamid.1');
    const second = await claimMessage(WA_ID, 'Asha Rao', 'wamid.2');

    expect(second?.id).toBe(first?.id);
    expect(second?.name).toBe('Asha Rao');
  });

  it('remembers only the last thirty message ids', async () => {
    for (let i = 0; i <= 30; i += 1) {
      await claimMessage(WA_ID, 'Asha', `wamid.${i}`);
    }

    const stored = await WhatsappChatModel.findOne({ waId: WA_ID }).lean();
    expect(stored?.seen).toHaveLength(30);
    expect(stored?.seen[0]).toBe('wamid.1');
    expect(stored?.seen[29]).toBe('wamid.30');
  });

  it('passes on a failure that is not a redelivery', async () => {
    jest
      .spyOn(WhatsappChatModel, 'findOneAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.reject(new Error('db down')) }));

    await expect(claimMessage(WA_ID, 'Asha', 'wamid.1')).rejects.toThrow('db down');
  });

  it('claims nothing when the database hands no chat back', async () => {
    jest
      .spyOn(WhatsappChatModel, 'findOneAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

    await expect(claimMessage(WA_ID, 'Asha', 'wamid.1')).resolves.toBeNull();
  });
});

describe('optionRegistry', () => {
  it('registers options under short ids, keeping the ones offered before', () => {
    const registry = optionRegistry({ old: option('a') });

    const id = registry.register(option('b'));

    expect(id).toMatch(/^o[0-9a-f]{10}$/);
    expect(registry.entries()).toEqual({ old: option('a'), [id]: option('b') });
  });

  it('forgets the oldest options past eighty', () => {
    const existing = Object.fromEntries(
      Array.from({ length: 80 }, (_, i) => [`old${i}`, option(`old${i}`)]),
    );
    const registry = optionRegistry(existing);

    const fresh = registry.register(option('new'));
    const entries = registry.entries();

    expect(Object.keys(entries)).toHaveLength(80);
    expect(entries.old0).toBeUndefined();
    expect(entries.old1).toEqual(option('old1'));
    expect(entries[fresh]).toEqual(option('new'));
  });
});

describe('nextDueAt and saveChat', () => {
  it('is the earliest reminder, or nothing when none is waiting', () => {
    expect(nextDueAt([])).toBeNull();
    expect(nextDueAt([push('a', 3_000), push('b', 1_000)])).toEqual(new Date(1_000));
  });

  it('saves the turn and the time the next reminder is due', async () => {
    const chat = await claimMessage(WA_ID, 'Asha', 'wamid.1');
    const at = new Date('2026-10-07T09:00:00Z');
    const state = { demoKey: 'salon', vars: {}, seq: 2, seed: 9 };

    await saveChat(chat?.id ?? '', {
      demoKey: 'salon',
      state,
      options: { o1: option('x') },
      pending: [push('p', at.getTime())],
      sessionId: 'wa-s',
      lastEventAt: at,
    });

    const stored = await WhatsappChatModel.findById(chat?.id).lean();
    expect(stored).toEqual(
      expect.objectContaining({ demoKey: 'salon', state, sessionId: 'wa-s', lastEventAt: at }),
    );
    expect(stored?.nextDueAt).toEqual(at);
    expect(stored?.options).toEqual({ o1: option('x') });
  });
});

describe('publishedBundles', () => {
  it('runs every industry that parses, and logs the parts that do not', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const salon = demoBundle('salon');
    jest
      .mocked(catalog)
      .mockResolvedValue([{ demo: { key: 'salon' } }, { demo: { key: 'broken' } }] as never);
    jest.mocked(toDemoBundle).mockImplementation((entry, warn: CatalogWarn) => {
      if (entry.demo.key === 'salon') {
        return salon;
      }
      warn('wa-demo: demo profile did not parse', new Error('bad'), { demo: 'broken' });
      return null;
    });

    await expect(publishedBundles()).resolves.toEqual([salon]);
    expect(warned).toHaveBeenCalledWith(
      { err: expect.any(Error), demo: 'broken' },
      'wa-demo: demo profile did not parse',
    );
  });
});
