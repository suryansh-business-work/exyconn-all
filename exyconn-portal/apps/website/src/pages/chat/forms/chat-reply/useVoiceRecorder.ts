import { useEffect, useRef, useState } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { ChatReplyFile } from './chat-reply.types';

const MB = 1024 * 1024;
const EXTENSION: Readonly<Record<string, string>> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

/** Why the microphone could not be used, in words the person can act on. */
function microphoneProblem(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access is blocked. Allow it for this site in your browser to record voice notes.';
  }
  if (name === 'NotFoundError') {
    return 'No microphone was found on this device.';
  }
  return 'The microphone could not be started.';
}

export const voiceNotesSupported = (): boolean =>
  'MediaRecorder' in globalThis && Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);

/**
 * Records a voice note with the browser's MediaRecorder. `stop` hands the note over as a data
 * URL whose MIME type has its codec parameters removed (the server accepts `audio/webm`, not
 * `audio/webm;codecs=opus`); `cancel` throws the recording away.
 */
export function useVoiceRecorder(maxUploadMb: number, onRecorded: (file: ChatReplyFile) => void) {
  const notify = useNotify();
  const recorder = useRef<MediaRecorder | null>(null);
  const keep = useRef(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) {
      return undefined;
    }
    setSeconds(0);
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const end = (save: boolean) => {
    keep.current = save;
    if (recorder.current?.state === 'recording') {
      recorder.current.stop();
    }
    recorder.current = null;
  };

  // Leaving the page mid-recording drops the note and releases the microphone.
  useEffect(
    () => () => {
      keep.current = false;
      if (recorder.current?.state === 'recording') {
        recorder.current.stop();
      }
    },
    [],
  );

  const finish = async (chunks: Blob[], stream: MediaStream) => {
    stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
    if (!keep.current || chunks.length === 0) {
      return;
    }
    const raw = new Blob(chunks, { type: chunks[0].type });
    const blob = new Blob([raw], { type: raw.type.split(';')[0] });
    if (blob.size > maxUploadMb * MB) {
      notify('The voice note is longer than the {size} MB limit allows', 'warning', {
        size: maxUploadMb,
      });
      return;
    }
    const extension = EXTENSION[blob.type] ?? 'webm';
    const name = `voice-note.${extension}`;
    const data = await fileToDataUrl(new File([blob], name, { type: blob.type }));
    onRecorded({ id: globalThis.crypto.randomUUID(), name, data, size: blob.size });
  };

  const start = async () => {
    try {
      const stream = await globalThis.navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        finish(chunks, stream).catch((error: unknown) => {
          portalLogger.warn('Could not prepare the voice note', error);
          notify('The voice note could not be attached', 'error');
        });
      };
      recorder.current = media;
      keep.current = true;
      media.start();
      setRecording(true);
    } catch (error) {
      portalLogger.warn('Could not start the microphone for a voice note', error);
      notify(microphoneProblem(error), 'error');
    }
  };

  return {
    recording,
    seconds,
    start: () => {
      start().catch((error: unknown) => portalLogger.warn('Voice note failed', error));
    },
    stop: () => end(true),
    cancel: () => end(false),
  };
}
