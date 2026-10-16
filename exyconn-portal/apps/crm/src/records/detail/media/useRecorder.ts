import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingKind = 'audio' | 'video';

/**
 * Records a voice note or a video clip in the browser (MediaRecorder). Chrome and Firefox
 * produce WebM, Safari MP4; the server accepts both. The camera and microphone are released
 * as soon as a recording stops, or the component goes.
 */
export function useRecorder() {
  const [recording, setRecording] = useState<RecordingKind | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const release = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  useEffect(() => release, [release]);

  const start = useCallback(async (kind: RecordingKind) => {
    stream.current = await navigator.mediaDevices.getUserMedia(
      kind === 'video' ? { audio: true, video: true } : { audio: true },
    );
    chunks.current = [];
    const next = new MediaRecorder(stream.current);
    next.ondataavailable = (event) => chunks.current.push(event.data);
    next.start();
    recorder.current = next;
    setStartedAt(Date.now());
    setRecording(kind);
  }, []);

  /** Ends the recording and hands back the file. */
  const stop = useCallback(
    () =>
      new Promise<File>((resolve) => {
        const active = recorder.current;
        if (!active) {
          return;
        }
        active.onstop = () => {
          const type = active.mimeType || 'audio/webm';
          const extension = type.includes('mp4') ? 'mp4' : 'webm';
          const name = `${recording ?? 'audio'}-recording-${new Date().toISOString()}.${extension}`;
          release();
          setRecording(null);
          resolve(new File(chunks.current, name, { type }));
        };
        active.stop();
      }),
    [recording, release],
  );

  return { recording, startedAt, start, stop };
}
