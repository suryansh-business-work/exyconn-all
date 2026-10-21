import { matchesPhrases, readableText, visibleAll } from './dom';
import { ACTIVITIES_SELECTOR, CONTROL_SELECTOR, TRANSCRIPTION_OFF_PHRASES } from './selectors';

export type ControlsResult = 'FOCUSED' | 'OPENED' | 'NOT_FOUND';

/**
 * Helps the user reach Meet's OWN transcription control. It focuses the visible "Start
 * transcription" control, or opens Meet's Activities panel where it lives. It never presses
 * the transcription control itself — turning transcription on is the user's decision.
 */
export function openTranscriptionControls(doc: Document): ControlsResult {
  const start = visibleAll(doc, CONTROL_SELECTOR).find((element) =>
    matchesPhrases(readableText(element), TRANSCRIPTION_OFF_PHRASES),
  );
  if (start instanceof HTMLElement) {
    start.focus();
    return 'FOCUSED';
  }
  const activities = visibleAll(doc, ACTIVITIES_SELECTOR)[0];
  if (activities instanceof HTMLElement) {
    activities.click();
    return 'OPENED';
  }
  return 'NOT_FOUND';
}
