/**
 * The audio a call carries, end to end. A browser call is 16 kHz 16-bit PCM; a phone call is
 * 8 kHz mu-law, which Vobiz, Sarvam's speech-to-text and Sarvam's text-to-speech all speak, so
 * a phone call's audio is never transcoded on its way through.
 */
export interface AudioFormat {
  encoding: 'linear16' | 'mulaw';
  sampleRate: 8000 | 16000;
}

export const BROWSER_AUDIO: AudioFormat = { encoding: 'linear16', sampleRate: 16000 };
export const PHONE_AUDIO: AudioFormat = { encoding: 'mulaw', sampleRate: 8000 };

/** How many bytes one second of this audio takes. */
export const bytesPerSecond = (format: AudioFormat): number =>
  format.sampleRate * (format.encoding === 'linear16' ? 2 : 1);

/** How long a base64 chunk of this audio plays for, in milliseconds. */
export const playMs = (base64: string, format: AudioFormat): number =>
  (Buffer.byteLength(base64, 'base64') / bytesPerSecond(format)) * 1000;
