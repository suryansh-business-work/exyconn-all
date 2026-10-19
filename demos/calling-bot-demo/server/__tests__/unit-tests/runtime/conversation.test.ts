import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BROWSER_AUDIO } from '../../../src/runtime/audio';
import { Conversation } from '../../../src/runtime/conversation';
import { streamReply, type ReplyRequest } from '../../../src/runtime/llm';
import { log } from '../../../src/runtime/log';
import { SpeechToText, type SpeechEvents } from '../../../src/runtime/sarvam/speech-to-text';
import { TextToSpeech, type VoiceEvents } from '../../../src/runtime/sarvam/text-to-speech';
import { addTurn, endCall, setStatus } from '../../../src/runtime/store';
import type { Transport } from '../../../src/runtime/transport';
import { makeCall, makeConfig } from '../fixtures';

vi.mock('../../../src/runtime/sarvam/speech-to-text', () => ({
  SpeechToText: vi.fn(function SpeechToText() {
    return { hear: vi.fn(), close: vi.fn() };
  }),
}));
vi.mock('../../../src/runtime/sarvam/text-to-speech', () => ({
  TextToSpeech: vi.fn(function TextToSpeech() {
    return { speak: vi.fn(), stop: vi.fn(), close: vi.fn() };
  }),
}));
vi.mock('../../../src/runtime/llm', () => ({ streamReply: vi.fn() }));
vi.mock('../../../src/runtime/store', () => ({
  setStatus: vi.fn(),
  addTurn: vi.fn(),
  endCall: vi.fn(),
}));
vi.mock('../../../src/runtime/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  errorText: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

type Listener = { hear: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
type Voice = Listener & { speak: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

/** A reply the test finishes by hand, the way OpenAI streams one. */
function pendingReply() {
  let request: ReplyRequest | undefined;
  let finish: (text: string) => void = () => undefined;
  vi.mocked(streamReply).mockImplementationOnce((given) => {
    request = given;
    return new Promise<string>((resolve, reject) => {
      finish = resolve;
      given.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  });
  return {
    request: () => {
      if (!request) {
        throw new Error('No reply was asked for');
      }
      return request;
    },
    finish: (text: string) => finish(text),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function answer() {
  const transport = {
    format: BROWSER_AUDIO,
    play: vi.fn(),
    clear: vi.fn(),
    notify: vi.fn(),
    hangUp: vi.fn(),
  } satisfies Transport;
  const call = makeCall();
  const config = makeConfig({ maxCallSeconds: 30 });
  const conversation = Conversation.open(call, config, transport);
  const speech = vi.mocked(SpeechToText).mock.calls[0][3] as SpeechEvents;
  const voiceEvents = vi.mocked(TextToSpeech).mock.calls[0][3] as VoiceEvents;
  const listener = vi.mocked(SpeechToText).mock.results[0].value as Listener;
  const voice = vi.mocked(TextToSpeech).mock.results[0].value as Voice;
  return { conversation, transport, call, speech, voiceEvents, listener, voice };
}

describe('a call with the bot', () => {
  beforeEach(() => {
    vi.mocked(setStatus).mockResolvedValue();
    vi.mocked(addTurn).mockResolvedValue();
    vi.mocked(endCall).mockResolvedValue();
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('opens speech in both directions with the config keys, voice and language', () => {
    answer();
    expect(SpeechToText).toHaveBeenCalledWith(
      'sarvam-test-key',
      'en-IN',
      BROWSER_AUDIO,
      expect.any(Object),
    );
    expect(TextToSpeech).toHaveBeenCalledWith(
      'sarvam-test-key',
      { model: 'bulbul:v2', speaker: 'anushka', languageCode: 'en-IN' },
      BROWSER_AUDIO,
      expect.any(Object),
    );
  });

  it('marks the call live and greets the caller, on screen and in the transcript', () => {
    const { transport, call, voice } = answer();
    expect(setStatus).toHaveBeenCalledWith(call, 'LIVE', { answeredAt: expect.any(Date) });
    expect(transport.notify).toHaveBeenCalledWith({
      type: 'turn',
      role: 'BOT',
      text: 'Hello, how can I help?',
    });
    expect(addTurn).toHaveBeenCalledWith(call, 'BOT', 'Hello, how can I help?');
    expect(voice.speak).toHaveBeenCalledWith('Hello, how can I help?');
  });

  it('logs, without failing the call, when the database misses a write', async () => {
    vi.mocked(setStatus).mockRejectedValueOnce(new Error('db down'));
    vi.mocked(addTurn).mockRejectedValueOnce(new Error('db busy'));
    const { conversation } = answer();
    vi.mocked(endCall).mockRejectedValueOnce(new Error('db gone'));
    conversation.end('ENDED', 'Caller hung up');
    await flush();
    const messages = vi.mocked(log.error).mock.calls.map(([message]) => message);
    expect(messages).toEqual([
      'could not mark the call live',
      'could not save a turn',
      'could not record the end of a call',
    ]);
    expect(vi.mocked(log.error).mock.calls[0][1]).toEqual({
      callId: '64b000000000000000000001',
      error: 'db down',
    });
  });

  it('passes the caller audio to speech-to-text until the call ends', () => {
    const { conversation, listener } = answer();
    conversation.hear('AAAA');
    conversation.end('ENDED', 'Caller hung up');
    conversation.hear('BBBB');
    expect(listener.hear.mock.calls).toEqual([['AAAA']]);
  });

  it('answers an utterance sentence by sentence and records the whole reply', async () => {
    const { call, speech, transport, voice } = answer();
    const reply = pendingReply();
    speech.onUtterance('I need a visit');
    expect(transport.notify).toHaveBeenCalledWith({
      type: 'turn',
      role: 'CALLER',
      text: 'I need a visit',
    });
    const request = reply.request();
    expect(request.apiKey).toBe('openai-test-key');
    expect(request.model).toBe('gpt-test');
    expect(request.messages[0]).toEqual({
      role: 'system',
      content: expect.stringMatching(/^You book clinic visits\.\n\nYou are speaking on a live voice call\./),
    });
    expect(request.messages.slice(1)).toEqual([
      { role: 'assistant', content: 'Hello, how can I help?' },
      { role: 'user', content: 'I need a visit' },
    ]);
    request.onText('Sure. Which ');
    request.onText('day');
    reply.finish('Sure. Which day');
    await flush();
    expect(voice.speak.mock.calls.slice(1)).toEqual([['Sure.'], ['Which day']]);
    expect(addTurn).toHaveBeenLastCalledWith(call, 'BOT', 'Sure. Which day');
  });

  it('speaks nothing extra when the reply ends on a full sentence', async () => {
    const { speech, voice } = answer();
    const reply = pendingReply();
    speech.onUtterance('Hi');
    reply.request().onText('Hello!\n');
    reply.finish('Hello!');
    await flush();
    expect(voice.speak.mock.calls.slice(1)).toEqual([['Hello!']]);
  });

  it('stops talking when the caller talks over its voice', () => {
    const { speech, voiceEvents, transport, voice } = answer();
    voiceEvents.onAudio(Buffer.alloc(32_000).toString('base64'));
    expect(transport.play).toHaveBeenCalled();
    speech.onSpeechStart();
    expect(voice.stop).toHaveBeenCalledTimes(1);
    expect(transport.clear).toHaveBeenCalledTimes(1);
    // Cut off already: a second interruption has nothing to stop.
    speech.onSpeechStart();
    expect(voice.stop).toHaveBeenCalledTimes(1);
  });

  it('lets the caller speak without interrupting once its voice has finished playing', () => {
    vi.useFakeTimers();
    const { speech, voiceEvents, voice } = answer();
    voiceEvents.onAudio(Buffer.alloc(3_200).toString('base64'));
    vi.advanceTimersByTime(200);
    speech.onSpeechStart();
    expect(voice.stop).not.toHaveBeenCalled();
  });

  it('abandons a reply the caller talks over and remembers only what was heard', async () => {
    const { call, speech, transport, voice } = answer();
    const reply = pendingReply();
    speech.onUtterance('Tell me everything');
    reply.request().onText('First part. Second');
    speech.onSpeechStart();
    await flush();
    expect(voice.stop).toHaveBeenCalled();
    expect(transport.clear).toHaveBeenCalled();
    expect(addTurn).toHaveBeenLastCalledWith(call, 'BOT', 'First part.…');
    expect(log.error).not.toHaveBeenCalled();
  });

  it('records nothing for a reply cut off before a word was spoken', async () => {
    const { speech } = answer();
    const reply = pendingReply();
    speech.onUtterance('Hello');
    reply.request().onText('Hmm');
    speech.onSpeechStart();
    await flush();
    expect(addTurn).toHaveBeenCalledTimes(2);
  });

  it('answers only the latest of two quick utterances', async () => {
    const { call, speech } = answer();
    const first = pendingReply();
    const second = pendingReply();
    speech.onUtterance('One');
    speech.onUtterance('Two');
    await flush();
    second.finish('Answer two');
    await flush();
    expect(first.request().signal.aborted).toBe(true);
    expect(addTurn).toHaveBeenLastCalledWith(call, 'BOT', 'Answer two');
    // The second reply is finished, so the caller talking now interrupts nothing.
    speech.onSpeechStart();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('logs a reply that failed on its own', async () => {
    const { speech, transport } = answer();
    vi.mocked(streamReply).mockRejectedValueOnce(new Error('OpenAI answered 500'));
    speech.onUtterance('Hello');
    await flush();
    expect(log.error).toHaveBeenCalledWith('could not answer', {
      callId: '64b000000000000000000001',
      error: 'OpenAI answered 500',
    });
    expect(transport.hangUp).not.toHaveBeenCalled();
  });

  it('ignores an utterance that arrives after the call ended', () => {
    const { conversation, speech } = answer();
    conversation.end('ENDED', 'Caller hung up');
    speech.onUtterance('Still there?');
    expect(streamReply).not.toHaveBeenCalled();
  });

  it('hangs up at the time limit', () => {
    vi.useFakeTimers();
    const { call, transport } = answer();
    vi.advanceTimersByTime(30_000);
    expect(endCall).toHaveBeenCalledWith(call, 'ENDED', 'Time limit reached');
    expect(transport.notify).toHaveBeenLastCalledWith({
      type: 'ended',
      reason: 'Time limit reached',
      failed: false,
    });
    expect(transport.hangUp).toHaveBeenCalledTimes(1);
  });

  it.each(['speech', 'voice'] as const)(
    'fails the call when %s breaks, ending it only once',
    (side) => {
      const { call, speech, voiceEvents, transport, listener, voice } = answer();
      const fail = side === 'speech' ? speech.onFailure : voiceEvents.onFailure;
      fail('Sarvam refused');
      fail('again');
      expect(endCall).toHaveBeenCalledTimes(1);
      expect(endCall).toHaveBeenCalledWith(call, 'FAILED', 'Sarvam refused');
      expect(transport.notify).toHaveBeenLastCalledWith({
        type: 'ended',
        reason: 'Sarvam refused',
        failed: true,
      });
      expect(listener.close).toHaveBeenCalledTimes(1);
      expect(voice.close).toHaveBeenCalledTimes(1);
    },
  );

  it('abandons a reply still streaming when the call ends', () => {
    const { conversation, speech } = answer();
    const reply = pendingReply();
    speech.onUtterance('Hello');
    conversation.end('ENDED', 'Caller hung up');
    expect(reply.request().signal.aborted).toBe(true);
  });
});
