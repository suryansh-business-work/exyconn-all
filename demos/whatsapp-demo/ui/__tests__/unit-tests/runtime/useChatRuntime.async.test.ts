import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { AiRequest } from '@exyconn/wa-flow';
import { engineMock } from './engine-mock';
import { mountRuntime as mount } from './runtime-harness';
import * as f from './runtime.fixtures';

vi.mock('@exyconn/wa-flow/engine', async () => (await import('./engine-mock')).engineMock);
const logger = vi.hoisted(() => ({ warn: vi.fn(), error: vi.fn() }));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

const request: AiRequest = {
  workflow: '$router',
  node: 'router',
  text: 'book me in',
  intents: [],
  entities: [],
};

/** Lets pending promise callbacks run. */
const settle = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

const lastEvent = () => engineMock.respond.mock.calls.at(-1)?.[2];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  engineMock.newChatState.mockImplementation((demoKey) => f.chatState(demoKey));
  engineMock.respond.mockReturnValue(f.result());
});

afterEach(() => {
  vi.useRealTimers();
  engineMock.respond.mockReset();
  engineMock.newChatState.mockReset();
  logger.warn.mockReset();
  logger.error.mockReset();
});

describe('useChatRuntime: free text read by the server', () => {
  it('asks the server, showing "typing…", then answers with its reading', async () => {
    const reading = { intent: 'book', entities: { date: 'tomorrow' } };
    const parse = vi.fn().mockResolvedValue(reading);
    engineMock.respond
      .mockReturnValueOnce(f.result({ ai: request }))
      .mockReturnValueOnce(f.result({ replies: [f.reply('booked', 100)] }));
    const { rt } = mount({ parse });
    act(() => rt().open('clinic'));
    expect(parse).toHaveBeenCalledWith(request, 'clinic');
    expect(rt().store.typing.clinic).toBe(true);
    await settle();
    expect(lastEvent()).toEqual({ type: 'ai', request, result: reading });
    act(() => vi.advanceTimersByTime(100));
    expect(rt().store.chats.clinic.messages.map((m) => m.id)).toEqual(['booked']);
  });

  it('waits until the replies before it have been revealed', () => {
    const parse = vi.fn().mockResolvedValue(null);
    engineMock.respond.mockReturnValueOnce(
      f.result({ ai: request, replies: [f.reply('one sec', 100)] }),
    );
    const { rt } = mount({ parse });
    act(() => rt().open('clinic'));
    expect(parse).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('follows the "not understood" path, with a warning, when the server call fails', async () => {
    const failure = new Error('offline');
    const parse = vi.fn().mockRejectedValue(failure);
    engineMock.respond.mockReturnValueOnce(f.result({ ai: request }));
    const { rt } = mount({ parse });
    act(() => rt().open('clinic'));
    await settle();
    expect(logger.warn).toHaveBeenCalledWith('wa-demo: AI parse failed', failure);
    expect(lastEvent()).toEqual({ type: 'ai', request, result: null });
  });

  it('logs an error when answering with the reading fails', async () => {
    const boom = new Error('engine broke');
    const parse = vi.fn().mockResolvedValue(null);
    engineMock.respond.mockReturnValueOnce(f.result({ ai: request })).mockImplementationOnce(() => {
      throw boom;
    });
    const { rt } = mount({ parse });
    act(() => rt().open('clinic'));
    await settle();
    expect(logger.error).toHaveBeenCalledWith('wa-demo: AI reply failed', boom);
  });

  it('does not ask anyone when there is no reader', () => {
    engineMock.respond.mockReturnValueOnce(f.result({ ai: request }));
    const { rt } = mount({ parse: undefined });
    act(() => rt().open('clinic'));
    expect(rt().store.typing.clinic).not.toBe(true);
    expect(engineMock.respond).toHaveBeenCalledTimes(1);
  });
});

describe('useChatRuntime: reminders', () => {
  it('delivers a reminder when it falls due and announces it away from the chat', () => {
    const onArrived = vi.fn();
    const due = f.push('p1', 5000);
    engineMock.respond.mockReturnValueOnce(f.result({ scheduled: [due] }));
    const { rt } = mount({ activeKey: 'salon', onArrived });
    act(() => rt().open('clinic'));
    act(() => vi.advanceTimersByTime(3000));
    expect(rt().store.pending).toEqual([due]);

    engineMock.respond.mockReturnValueOnce(f.result({ replies: [f.reply('reminder', 100)] }));
    act(() => vi.advanceTimersByTime(1000));
    expect(lastEvent()).toEqual({ type: 'push', push: due });
    expect(rt().store.pending).toEqual([]);
    act(() => vi.advanceTimersByTime(100));
    expect(onArrived).toHaveBeenCalledWith('clinic', expect.objectContaining({ id: 'reminder' }));
    expect(rt().store.chats.clinic.unread).toBe(1);
  });

  it('holds a reminder for a demo that is no longer in the catalog', () => {
    const orphan = f.push('p2', 2000, 'salon');
    engineMock.respond.mockReturnValueOnce(f.result({ scheduled: [orphan] }));
    const { rt } = mount();
    act(() => rt().open('clinic'));
    act(() => vi.advanceTimersByTime(5000));
    expect(rt().store.pending).toEqual([orphan]);
    expect(engineMock.respond).toHaveBeenCalledTimes(1);
  });

  it('stops checking for reminders once unmounted', () => {
    engineMock.respond.mockReturnValueOnce(f.result({ scheduled: [f.push('p1', 2000)] }));
    const { rt, hook } = mount();
    act(() => rt().open('clinic'));
    hook.unmount();
    vi.advanceTimersByTime(5000);
    expect(engineMock.respond).toHaveBeenCalledTimes(1);
  });
});
