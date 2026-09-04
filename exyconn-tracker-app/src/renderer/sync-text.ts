import type { AlertColor } from '@exyconn/ui';
import type { SyncOutcome } from '@shared/types';

export interface SyncMessage {
  severity: AlertColor;
  text: string;
}

function plural(count: number): string {
  return count === 1 ? 'item' : 'items';
}

function uploadedText(count: number, discarded: number): string {
  const uploaded = `Uploaded ${count} ${plural(count)}.`;
  if (discarded === 0) {
    return uploaded;
  }
  // Say it out loud. Silently dropping an employee's recorded work would be indefensible.
  return `${uploaded} ${discarded} ${plural(discarded)} could not be uploaded and ${discarded === 1 ? 'was' : 'were'} skipped.`;
}

/**
 * Every sync attempt gets a sentence. Pressing "Sync now" and being told nothing is what made
 * the button feel broken — most of the time there was simply nothing queued to upload.
 */
export function syncMessage(outcome: SyncOutcome | null): SyncMessage | null {
  if (outcome === null) {
    return null;
  }
  if (outcome.kind === 'uploaded') {
    const severity = outcome.discarded > 0 ? 'warning' : 'success';
    return { severity, text: uploadedText(outcome.count, outcome.discarded) };
  }
  if (outcome.kind === 'nothing') {
    return {
      severity: 'info',
      text: 'Nothing to upload — everything recorded so far is already on the portal.',
    };
  }
  if (outcome.kind === 'unavailable') {
    return { severity: 'info', text: outcome.reason };
  }
  return { severity: 'warning', text: outcome.reason };
}
