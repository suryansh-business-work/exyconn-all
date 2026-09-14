import type { SyncOutcome } from './types';
import type { Translate } from './translate';

/** The four alert tones every UI kit names the same way. */
export type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SyncMessage {
  severity: AlertSeverity;
  text: string;
}

/**
 * Each count gets its own whole sentence rather than an "item"/"items" fragment dropped into
 * a shared one: a language that inflects the verb or the noun with the number cannot be
 * translated a word at a time.
 */
function uploadedSentence(t: Translate, count: number): string {
  if (count === 1) {
    return t('Uploaded {count} item.', { count });
  }
  return t('Uploaded {count} items.', { count });
}

function discardedSentence(t: Translate, count: number): string {
  if (count === 1) {
    return t('{count} item could not be uploaded and was skipped.', { count });
  }
  return t('{count} items could not be uploaded and were skipped.', { count });
}

function uploadedText(t: Translate, count: number, discarded: number): string {
  const uploaded = uploadedSentence(t, count);
  if (discarded === 0) {
    return uploaded;
  }
  // Say it out loud. Silently dropping an employee's recorded work would be indefensible.
  return `${uploaded} ${discardedSentence(t, discarded)}`;
}

/**
 * Every sync attempt gets a sentence. Pressing "Sync now" and being told nothing is what made
 * the button feel broken — most of the time there was simply nothing queued to upload.
 *
 * `reason` is translated like the rest. It is written in the main process, which has no
 * translator of its own — but every sentence it can produce is one somebody wrote
 * (`describeSyncFailure`), never a runtime fault's own message, so each is a catalogue key.
 */
export function syncMessage(t: Translate, outcome: SyncOutcome | null): SyncMessage | null {
  if (outcome === null) {
    return null;
  }
  if (outcome.kind === 'uploaded') {
    const severity = outcome.discarded > 0 ? 'warning' : 'success';
    return { severity, text: uploadedText(t, outcome.count, outcome.discarded) };
  }
  if (outcome.kind === 'nothing') {
    return {
      severity: 'info',
      text: t('Nothing to upload — everything recorded so far is already on the portal.'),
    };
  }
  if (outcome.kind === 'unavailable') {
    return { severity: 'info', text: t(outcome.reason) };
  }
  return { severity: 'warning', text: t(outcome.reason) };
}
