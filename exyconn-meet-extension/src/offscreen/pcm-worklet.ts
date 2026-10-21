/**
 * The AudioWorklet that hands raw samples to the recorder. Loaded with
 * `audioWorklet.addModule(chrome.runtime.getURL('pcm-worklet.js'))` — a packaged file, never
 * inline or blob code, so it runs under the extension's `script-src 'self'` policy.
 *
 * It runs inside a 16 kHz AudioContext, so every frame it posts is already 16 kHz mono.
 */

/** The worklet global scope's API, which the DOM typings do not describe. */
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void;

/** Must match PCM_PROCESSOR in recorder.ts. */
const NAME = 'exyconn-pcm-capture';

class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel !== undefined && channel.length > 0) {
      // Copied: the engine reuses the input buffer for the next render quantum.
      this.port.postMessage(channel.slice());
    }
    return true;
  }
}

registerProcessor(NAME, PcmCaptureProcessor);

// A module (the worklet is loaded with addModule), so it can be imported by its unit test.
export {};
