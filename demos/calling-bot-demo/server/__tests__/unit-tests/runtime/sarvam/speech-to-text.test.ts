import { afterEach, describe, expect, it, vi } from 'vitest';
import { BROWSER_AUDIO, PHONE_AUDIO } from '../../../../src/runtime/audio';
import { FakeWebSocket } from '../../fakeWs';
import { SpeechToText } from '../../../../src/runtime/sarvam/speech-to-text';

vi.mock('ws', async () => ({ default: (await import('../../fakeWs.js')).FakeWebSocket }));


function listen(languageCode = 'hi-IN', format = BROWSER_AUDIO) {
  const events = { onSpeechStart: vi.fn(), onUtterance: vi.fn(), onFailure: vi.fn() };
  const stt = new SpeechToText('sarvam-test-key', languageCode, format, events);
  const socket = FakeWebSocket.last();
  return { stt, events, socket, query: new URL(socket.url).searchParams };
}

describe("a call's speech-to-text stream", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the realtime stream in the call language and audio format', () => {
    const { socket, query } = listen('hi-IN', PHONE_AUDIO);
    expect(socket.url.startsWith('wss://api.sarvam.ai/speech-to-text-realtime/ws?')).toBe(true);
    expect(socket.options.headers).toEqual({ 'API-SUBSCRIPTION-KEY': 'sarvam-test-key' });
    expect(Object.fromEntries(query)).toEqual({
      language_code: 'hi-IN',
      model: 'saaras:v3-realtime',
      stream_type: 'fast',
      mode: 'transcribe',
      endpointing: 'vad',
      encoding: 'mulaw',
      sample_rate: '8000',
      silence_duration_ms: '400',
    });
  });

  it('asks for Odia by the code speech-to-text knows', () => {
    expect(listen('od-IN').query.get('language_code')).toBe('or-IN');
  });

  it('reports the caller starting to talk and each finished utterance', () => {
    const { events, socket } = listen();
    socket.deliver('{"event":"vad.speech_start"}');
    socket.deliver('{"event":"transcript.final","text":"  book a visit  "}');
    socket.deliver('{"event":"transcript.final","text":"   "}');
    socket.deliver('{"event":"transcript.final","text":42}');
    socket.deliver('{"event":"transcript.partial","text":"bo"}');
    expect(events.onSpeechStart).toHaveBeenCalledTimes(1);
    expect(events.onUtterance.mock.calls).toEqual([['book a visit']]);
  });

  it('fails the call on a fatal error only', () => {
    const { events, socket } = listen();
    socket.deliver('{"event":"error","is_fatal":false,"message":"hiccup"}');
    socket.deliver('{"event":"error","is_fatal":true,"message":"quota exceeded"}');
    socket.deliver('{"event":"error","is_fatal":true}');
    expect(events.onFailure.mock.calls).toEqual([
      ['Sarvam speech-to-text: quota exceeded'],
      ['Sarvam speech-to-text: failed'],
    ]);
  });

  it('fails the call when the socket drops', () => {
    const { events, socket } = listen();
    socket.emit('close', 1011, Buffer.from('gone'));
    expect(events.onFailure).toHaveBeenCalledWith(
      'Sarvam speech-to-text closed the connection (1011: gone).',
    );
  });

  it('streams caller audio and says goodbye on close', () => {
    const { stt, socket } = listen();
    socket.open();
    stt.hear('AAAA');
    stt.close();
    expect(socket.sentJson()).toEqual([{ event: 'audio_input', audio: 'AAAA' }, { event: 'end' }]);
    expect(socket.close).toHaveBeenCalled();
  });
});
