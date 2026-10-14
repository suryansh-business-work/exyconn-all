import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/**
 * The worklet that frames the microphone, shipped as its own file: Vite would otherwise inline
 * a file this small as a `data:` URL, which not every browser loads as a worklet module.
 */
import WORKLET_URL from './mic-frames.worklet.js?url&no-inline';

/** A running microphone: stop() releases the device. */
export interface Microphone {
  stop: () => void;
}

/**
 * Opens the microphone (with the browser's echo cancellation, so the bot does not hear itself
 * through the speakers) and hands over 20 ms frames of 16 kHz 16-bit PCM as they are captured.
 */
export async function openMicrophone(onFrame: (frame: ArrayBuffer) => void): Promise<Microphone> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const context = new AudioContext();
  // A context made outside a click starts suspended; this runs straight after the caller's click.
  await context.resume();
  await context.audioWorklet.addModule(WORKLET_URL);
  const source = context.createMediaStreamSource(stream);
  const frames = new AudioWorkletNode(context, 'mic-frames');
  frames.port.onmessage = (event: MessageEvent<ArrayBuffer>) => onFrame(event.data);
  source.connect(frames);
  return {
    stop: () => {
      frames.port.onmessage = null;
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      context
        .close()
        .catch((error: unknown) => portalLogger.warn('Could not close the microphone', error));
    },
  };
}
