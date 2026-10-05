import { h, icon, on } from '../dom';
import { icons } from '../icons';
import { MAX_RECORDING_SECONDS, startRecording, type Recording } from '../recorder';
import { strings } from '../strings';
import { formatDuration } from '../time';
import type { OutgoingFile } from '../types';

export interface VoiceControl {
  button: HTMLButtonElement;
  bar: HTMLElement;
}

const isPermissionError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'NotAllowedError' || error.name === 'SecurityError');

/** The microphone: record (up to two minutes), then send or throw away. */
export function createVoice(
  onSend: (file: OutgoingFile) => void,
  onError: (message: string) => void,
): VoiceControl {
  const button = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.record,
  });
  button.append(icon(icons.mic));
  const timer = h('span', { class: 'cw-timer' }, formatDuration(0));
  const cancel = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.cancelRecording,
  });
  cancel.append(icon(icons.delete));
  const stop = h(
    'button',
    { type: 'button', class: 'cw-button cw-primary' },
    icon(icons.stop),
    strings.stopSend,
  );
  const bar = h(
    'div',
    { class: 'cw-recording', role: 'group', 'aria-label': strings.recording, hidden: true },
    h('span', { class: 'cw-rec-dot', 'aria-hidden': 'true' }),
    h('span', {}, strings.recording),
    timer,
    cancel,
    stop,
  );
  let recording: Recording | null = null;

  const show = (active: boolean): void => {
    bar.hidden = !active;
    button.hidden = active;
    timer.textContent = formatDuration(0);
  };

  const finish = (): void => {
    const current = recording;
    recording = null;
    show(false);
    button.focus();
    current
      ?.stop()
      .then(onSend)
      .catch((error: unknown) => {
        console.warn('[chat-widget] voice note failed', error);
        onError(strings.micFailed);
      });
  };

  const tick = (seconds: number): void => {
    timer.textContent = formatDuration(seconds);
    if (seconds >= MAX_RECORDING_SECONDS) {
      finish();
    }
  };

  on(button, 'click', () => {
    startRecording(tick)
      .then((started) => {
        recording = started;
        show(true);
        stop.focus();
      })
      .catch((error: unknown) => {
        console.warn('[chat-widget] microphone unavailable', error);
        onError(isPermissionError(error) ? strings.micDenied : strings.micFailed);
      });
  });
  on(stop, 'click', finish);
  on(cancel, 'click', () => {
    recording?.cancel();
    recording = null;
    show(false);
    button.focus();
  });

  return { button, bar };
}
