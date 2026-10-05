import { readDataUrl, withoutTypeParams } from './files';
import type { OutgoingFile } from './types';

/** Voice notes stop on their own after two minutes. */
export const MAX_RECORDING_SECONDS = 120;

const EXTENSION: Readonly<Record<string, string>> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

export interface Recording {
  /** Stops and hands back the note as a file ready to send. */
  stop(): Promise<OutgoingFile>;
  /** Stops and throws the note away. */
  cancel(): void;
}

export function canRecord(): boolean {
  return 'MediaRecorder' in globalThis && Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);
}

/**
 * Starts recording from the microphone. Rejects with the browser's DOMException when access is
 * refused (`NotAllowedError`), so the caller can tell the visitor how to allow it.
 */
export async function startRecording(onTick: (seconds: number) => void): Promise<Recording> {
  const stream = await globalThis.navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  let seconds = 0;
  const timer = setInterval(() => {
    seconds += 1;
    onTick(seconds);
  }, 1000);
  recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
  const stopped = new Promise<Blob>((resolve) => {
    recorder.addEventListener('stop', () => resolve(new Blob(chunks, { type: recorder.mimeType })));
  });
  const finish = (): void => {
    clearInterval(timer);
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    stream.getTracks().forEach((track) => track.stop());
  };
  recorder.start();
  return {
    async stop() {
      finish();
      const blob = withoutTypeParams(await stopped);
      const extension = EXTENSION[blob.type] ?? 'webm';
      return { name: `voice-note-${Date.now()}.${extension}`, data: await readDataUrl(blob) };
    },
    cancel: finish,
  };
}
