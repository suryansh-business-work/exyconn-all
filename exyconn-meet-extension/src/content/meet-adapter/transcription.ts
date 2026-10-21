import type { TranscriptionState } from '../../types/meeting';
import { matchesPhrases, readableText, visibleAll } from './dom';
import {
  CONTROL_SELECTOR,
  STATUS_SELECTOR,
  TRANSCRIPTION_LABEL_SELECTOR,
  TRANSCRIPTION_OFF_PHRASES,
  TRANSCRIPTION_ON_PHRASES,
} from './selectors';

const CANDIDATES = `${TRANSCRIPTION_LABEL_SELECTOR}, ${CONTROL_SELECTOR}, ${STATUS_SELECTOR}`;

/** A transcription switch says its own state through aria-checked / aria-pressed. */
function switchState(element: Element): TranscriptionState {
  const checked = element.getAttribute('aria-checked') ?? element.getAttribute('aria-pressed');
  if (checked === 'true') {
    return 'ON';
  }
  if (checked === 'false') {
    return 'OFF';
  }
  return 'UNKNOWN';
}

function readOne(element: Element): TranscriptionState {
  const text = readableText(element);
  if (!text.includes('transcri')) {
    return 'UNKNOWN';
  }
  if (element.getAttribute('role') === 'switch') {
    return switchState(element);
  }
  if (matchesPhrases(text, TRANSCRIPTION_ON_PHRASES)) {
    return 'ON';
  }
  return matchesPhrases(text, TRANSCRIPTION_OFF_PHRASES) ? 'OFF' : 'UNKNOWN';
}

/**
 * Meet's own transcription, as the visible UI shows it. ON when any indicator or control
 * says it is running; OFF only when a visible control clearly offers to start it; otherwise
 * UNKNOWN — never OFF just because nothing could be read.
 */
export function readTranscriptionState(doc: Document): TranscriptionState {
  let state: TranscriptionState = 'UNKNOWN';
  for (const element of visibleAll(doc, CANDIDATES)) {
    const read = readOne(element);
    if (read === 'ON') {
      return 'ON';
    }
    if (read === 'OFF') {
      state = 'OFF';
    }
  }
  return state;
}
