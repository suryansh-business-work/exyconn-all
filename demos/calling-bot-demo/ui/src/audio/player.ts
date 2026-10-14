import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** The bot's voice arrives as 16 kHz 16-bit mono PCM (the voice server's browser format). */
const SAMPLE_RATE = 16000;

/**
 * Plays the bot's voice chunk after chunk without gaps, and stops at once when the caller
 * talks over it (`clear`).
 */
export class PcmPlayer {
  private readonly context = new AudioContext();
  private readonly playing = new Set<AudioBufferSourceNode>();
  private nextStart = 0;

  play(chunk: ArrayBuffer): void {
    const pcm = new Int16Array(chunk);
    if (pcm.length === 0) {
      return;
    }
    const buffer = this.context.createBuffer(1, pcm.length, SAMPLE_RATE);
    const samples = buffer.getChannelData(0);
    pcm.forEach((value, index) => {
      samples[index] = value / 0x8000;
    });
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    const startAt = Math.max(this.context.currentTime, this.nextStart);
    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
    this.playing.add(source);
    source.onended = () => this.playing.delete(source);
  }

  /** Stops everything queued: the caller is talking. */
  clear(): void {
    this.playing.forEach((source) => source.stop());
    this.playing.clear();
    this.nextStart = 0;
  }

  close(): void {
    this.clear();
    this.context
      .close()
      .catch((error: unknown) => portalLogger.warn('Could not close the speaker', error));
  }
}
