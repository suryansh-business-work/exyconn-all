import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** Two soft notes, a fifth apart (E5 then B5): short enough not to nag, clear enough to notice. */
const NOTES_HZ = [659.25, 987.77];
const NOTE_GAP_S = 0.12;
const NOTE_LENGTH_S = 0.35;
const PEAK_GAIN = 0.18;

let context: AudioContext | null = null;

function audioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

function playNote(audio: AudioContext, frequency: number, startAt: number): void {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + NOTE_LENGTH_S);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + NOTE_LENGTH_S);
}

/**
 * The new-message chime, made with the Web Audio API so there is no sound file to ship.
 * Browsers keep audio locked until the page has been clicked once; until then it stays quiet.
 */
export function playChime(): void {
  try {
    const audio = audioContext();
    const start = () => {
      NOTES_HZ.forEach((frequency, step) => {
        playNote(audio, frequency, audio.currentTime + step * NOTE_GAP_S);
      });
    };
    if (audio.state === 'suspended') {
      audio
        .resume()
        .then(start)
        .catch((error: unknown) => portalLogger.warn('The chat chime is blocked', error));
      return;
    }
    start();
  } catch (error) {
    portalLogger.warn('Could not play the chat chime', error);
  }
}
