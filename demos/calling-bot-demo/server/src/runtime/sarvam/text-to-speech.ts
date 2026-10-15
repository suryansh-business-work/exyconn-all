import type { AudioFormat } from '../audio';
import { SarvamSocket } from './socket';

/** Sarvam's streaming text-to-speech (docs.sarvam.ai, TTS WebSocket). */
const TTS_URL = 'wss://api.sarvam.ai/text-to-speech/ws';

/** Characters buffered before synthesis starts: Sarvam's lowest, so the first word comes soonest. */
const MIN_BUFFER = 30;

/** Which service failed, at the head of every failure reason. */
const SERVICE = 'Sarvam text-to-speech';

export interface VoiceSettings {
  model: string;
  speaker: string;
  languageCode: string;
}

export interface VoiceEvents {
  /** A chunk of the bot's voice, base64, in the format the stream was opened with. */
  onAudio: (audio: string) => void;
  onFailure: (reason: string) => void;
}

/**
 * One call's text-to-speech stream: sentences in, audio out. Resending the config drops any
 * text not yet spoken, which is how the bot stops when the caller talks over it.
 */
export class TextToSpeech {
  private readonly socket: SarvamSocket;
  private readonly config: Record<string, unknown>;
  /** Set when the bot is cut off: audio still arriving for the dropped words is not played. */
  private muted = false;

  constructor(apiKey: string, voice: VoiceSettings, format: AudioFormat, events: VoiceEvents) {
    const query = new URLSearchParams({ model: voice.model, send_completion_event: 'true' });
    this.config = {
      type: 'config',
      data: {
        language_code: voice.languageCode,
        speaker: voice.speaker,
        // The WebSocket API takes the rate as a string enum ("8000", "16000", ...); a number is
        // refused with an error right after the config, which ended every call after its greeting.
        speech_sample_rate: String(format.sampleRate),
        output_audio_codec: format.encoding,
        min_buffer_size: MIN_BUFFER,
      },
    };
    this.socket = new SarvamSocket(
      SERVICE,
      `${TTS_URL}?${query.toString()}`,
      { 'Api-Subscription-Key': apiKey },
      { type: 'ping' },
      {
        onFailure: events.onFailure,
        onMessage: (message) => this.dispatch(message, events),
      },
    );
    this.socket.send(this.config);
  }

  private dispatch(message: Record<string, unknown>, events: VoiceEvents): void {
    const data = message.data as Record<string, unknown> | undefined;
    if (message.type === 'audio' && typeof data?.audio === 'string' && !this.muted) {
      events.onAudio(data.audio);
    } else if (message.type === 'error') {
      const detail = typeof data?.message === 'string' ? data.message : 'failed';
      events.onFailure(`${SERVICE}: ${detail}`);
    }
  }

  /** Speaks one sentence now. */
  speak(text: string): void {
    this.muted = false;
    this.socket.send({ type: 'text', data: { text } });
    this.socket.send({ type: 'flush' });
  }

  /** Drops whatever has not been spoken yet. */
  stop(): void {
    this.muted = true;
    this.socket.send(this.config);
  }

  close(): void {
    this.socket.close();
  }
}
