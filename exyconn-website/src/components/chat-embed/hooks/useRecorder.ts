import { useCallback, useEffect, useRef, useState } from "react";
import {
  canRecord,
  isPermissionDenied,
  MAX_RECORDING_SECONDS,
  startRecording,
  type Recording,
} from "../lib/recorder";
import { strings } from "../strings";
import type { OutgoingFile } from "../types";

interface RecorderOptions {
  onDone: (file: OutgoingFile) => void;
  onError: (message: string) => void;
}

/**
 * A voice note: start asks for the microphone, the timer counts up, stop hands the note to
 * `onDone`, cancel throws it away. It stops by itself at the two-minute limit.
 */
export function useRecorder({ onDone, onError }: Readonly<RecorderOptions>) {
  const recording = useRef<Recording | null>(null);
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const callbacks = useRef({ onDone, onError });
  callbacks.current = { onDone, onError };

  const stop = useCallback(() => {
    const current = recording.current;
    recording.current = null;
    setActive(false);
    current
      ?.stop()
      .then((file) => callbacks.current.onDone(file))
      .catch((error: unknown) => {
        console.warn("[chat] voice note failed", error);
        callbacks.current.onError(strings.micFailed);
      });
  }, []);

  const cancel = useCallback(() => {
    recording.current?.cancel();
    recording.current = null;
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (!canRecord()) {
      callbacks.current.onError(strings.micUnsupported);
      return;
    }
    startRecording()
      .then((next) => {
        recording.current = next;
        setSeconds(0);
        setActive(true);
      })
      .catch((error: unknown) => {
        console.warn("[chat] microphone unavailable", error);
        callbacks.current.onError(
          isPermissionDenied(error) ? strings.micDenied : strings.micFailed
        );
      });
  }, []);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (seconds >= MAX_RECORDING_SECONDS) {
      stop();
    }
  }, [seconds, stop]);

  useEffect(() => () => recording.current?.cancel(), []);

  return { active, seconds, start, stop, cancel };
}
