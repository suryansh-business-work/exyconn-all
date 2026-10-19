import { afterEach, describe, expect, it, vi } from 'vitest';
import { BROWSER_AUDIO, PHONE_AUDIO } from '../../../../src/runtime/audio';
import { FakeWebSocket } from '../../fakeWs';
import { TextToSpeech } from '../../../../src/runtime/sarvam/text-to-speech';

vi.mock('ws', async () => ({ default: (await import('../../fakeWs.js')).FakeWebSocket }));


const VOICE = { model: 'bulbul:v2', speaker: 'anushka', languageCode: 'hi-IN' };

function speakWith(format = PHONE_AUDIO) {
  const events = { onAudio: vi.fn(), onFailure: vi.fn() };
  const tts = new TextToSpeech('sarvam-test-key', VOICE, format, events);
  const socket = FakeWebSocket.last();
  socket.open();
  return { tts, events, socket };
}

const CONFIG = {
  type: 'config',
  data: {
    language_code: 'hi-IN',
    speaker: 'anushka',
    speech_sample_rate: '8000',
    output_audio_codec: 'mulaw',
    min_buffer_size: 30,
  },
};

describe("a call's text-to-speech stream", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the stream for the model and sends the voice config first, the rate as text', () => {
    const { socket } = speakWith();
    expect(socket.url).toBe(
      'wss://api.sarvam.ai/text-to-speech/ws?model=bulbul%3Av2&send_completion_event=true',
    );
    expect(socket.options.headers).toEqual({ 'Api-Subscription-Key': 'sarvam-test-key' });
    expect(socket.sentJson()).toEqual([CONFIG]);
  });

  it('speaks the browser format when the call is from a browser', () => {
    const { socket } = speakWith(BROWSER_AUDIO);
    expect(socket.sentJson()[0]).toMatchObject({
      data: { speech_sample_rate: '16000', output_audio_codec: 'linear16' },
    });
  });

  it('speaks a sentence at once and plays the audio that comes back', () => {
    const { tts, events, socket } = speakWith();
    tts.speak('Namaste');
    socket.deliver('{"type":"audio","data":{"audio":"QUJD"}}');
    socket.deliver('{"type":"audio","data":{}}');
    socket.deliver('{"type":"event","data":{"event_type":"final"}}');
    expect(socket.sentJson().slice(1)).toEqual([
      { type: 'text', data: { text: 'Namaste' } },
      { type: 'flush' },
    ]);
    expect(events.onAudio.mock.calls).toEqual([['QUJD']]);
  });

  it('drops what is left to say, and its late audio, until the next sentence', () => {
    const { tts, events, socket } = speakWith();
    tts.stop();
    socket.deliver('{"type":"audio","data":{"audio":"TEFURQ=="}}');
    expect(events.onAudio).not.toHaveBeenCalled();
    expect(socket.sentJson()).toEqual([CONFIG, CONFIG]);
    tts.speak('Next');
    socket.deliver('{"type":"audio","data":{"audio":"TkVX"}}');
    expect(events.onAudio).toHaveBeenCalledWith('TkVX');
  });

  it('fails the call on an error message', () => {
    const { events, socket } = speakWith();
    socket.deliver('{"type":"error","data":{"message":"bad speaker"}}');
    socket.deliver('{"type":"error"}');
    expect(events.onFailure.mock.calls).toEqual([
      ['Sarvam text-to-speech: bad speaker'],
      ['Sarvam text-to-speech: failed'],
    ]);
  });

  it('closes its socket', () => {
    const { tts, socket } = speakWith();
    tts.close();
    expect(socket.close).toHaveBeenCalled();
  });
});
