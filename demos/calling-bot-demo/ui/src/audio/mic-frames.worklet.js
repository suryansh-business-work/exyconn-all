/**
 * Runs on the audio thread: turns the microphone's samples (at whatever rate the device runs)
 * into 16 kHz 16-bit PCM and posts it to the page in 20 ms frames, which the page sends to
 * the voice server as they come.
 */
const TARGET_RATE = 16000;
const FRAME_SAMPLES = 320;

class MicFrames extends AudioWorkletProcessor {
  constructor() {
    super();
    // `sampleRate` is the audio thread's own rate (a global in the worklet scope).
    this.step = sampleRate / TARGET_RATE;
    this.position = 0;
    this.frame = new Int16Array(FRAME_SAMPLES);
    this.filled = 0;
  }

  push(sample) {
    const clamped = Math.max(-1, Math.min(1, sample));
    this.frame[this.filled] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    this.filled += 1;
    if (this.filled === FRAME_SAMPLES) {
      this.port.postMessage(this.frame.buffer, [this.frame.buffer]);
      this.frame = new Int16Array(FRAME_SAMPLES);
      this.filled = 0;
    }
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      // Picks every `step`-th sample: the device rate is a whole multiple of 16 kHz on almost
      // every machine (48 kHz), and speech-to-text needs nothing finer.
      while (this.position < channel.length) {
        this.push(channel[Math.floor(this.position)]);
        this.position += this.step;
      }
      this.position -= channel.length;
    }
    return true;
  }
}

registerProcessor('mic-frames', MicFrames);
