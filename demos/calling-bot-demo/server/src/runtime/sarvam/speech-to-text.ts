import type { AudioFormat } from '../audio';
import { SarvamSocket } from './socket';

/** Sarvam's realtime speech-to-text, built for voice agents (docs.sarvam.ai, Realtime STT). */
const STT_URL = 'wss://api.sarvam.ai/speech-to-text-realtime/ws';

/**
 * How long a pause ends an utterance. Sarvam's default is 500 ms; a little less makes the bot
 * answer sooner, at the cost of now and then cutting in on a slow speaker.
 */
const SILENCE_MS = '400';

/** Which service failed, at the head of every failure reason. */
const SERVICE = 'Sarvam speech-to-text';

/**
 * Text-to-speech names Odia `od-IN`; realtime speech-to-text knows it only as `or-IN`. Every
 * other language has one code for both.
 */
const STT_LANGUAGE: Readonly<Record<string, string>> = { 'od-IN': 'or-IN' };

export interface SpeechEvents {
  /** The caller started talking — the moment to stop the bot mid-sentence. */
  onSpeechStart: () => void;
  /** One finished utterance, as text. */
  onUtterance: (text: string) => void;
  onFailure: (reason: string) => void;
}

/** One call's speech-to-text stream: caller audio in, finished utterances out. */
export class SpeechToText {
  private readonly socket: SarvamSocket;

  constructor(apiKey: string, languageCode: string, format: AudioFormat, events: SpeechEvents) {
    const query = new URLSearchParams({
      language_code: STT_LANGUAGE[languageCode] ?? languageCode,
      model: 'saaras:v3-realtime',
      stream_type: 'fast',
      mode: 'transcribe',
      endpointing: 'vad',
      encoding: format.encoding,
      sample_rate: String(format.sampleRate),
      silence_duration_ms: SILENCE_MS,
    });
    this.socket = new SarvamSocket(
      SERVICE,
      `${STT_URL}?${query.toString()}`,
      { 'API-SUBSCRIPTION-KEY': apiKey },
      { event: 'ping' },
      {
        onFailure: events.onFailure,
        onMessage: (message) => SpeechToText.dispatch(message, events),
      },
    );
  }

  private static dispatch(message: Record<string, unknown>, events: SpeechEvents): void {
    if (message.event === 'vad.speech_start') {
      events.onSpeechStart();
    } else if (message.event === 'transcript.final') {
      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (text) {
        events.onUtterance(text);
      }
    } else if (message.event === 'error' && message.is_fatal === true) {
      const detail = typeof message.message === 'string' ? message.message : 'failed';
      events.onFailure(`${SERVICE}: ${detail}`);
    }
  }

  /** A chunk of caller audio, base64, in the format the stream was opened with. */
  hear(audio: string): void {
    this.socket.send({ event: 'audio_input', audio });
  }

  close(): void {
    this.socket.close({ event: 'end' });
  }
}
