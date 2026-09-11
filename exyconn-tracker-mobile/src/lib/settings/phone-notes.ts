import type { SettingRow } from '@exyconn/tracker-core';
import type { Capabilities } from '../../tracker/types';

/** A workspace setting, plus what it means (or does not) on this phone. */
export interface PhoneSettingRow extends SettingRow {
  note?: string;
}

const NO_SCREENSHOTS = 'Not on this phone — it takes no screenshots.';

/** Every screenshot-shaped setting is moot on a phone that cannot capture the screen. */
const SCREENSHOT_ROWS: ReadonlyMap<string, string> = new Map([
  ['screenshots', 'Not on this phone — iPhone does not let apps capture the screen.'],
  ['randomize', NO_SCREENSHOTS],
  ['quality', NO_SCREENSHOTS],
  ['blur', NO_SCREENSHOTS],
  ['capture-sound', 'Not on this phone — there are no captures to announce.'],
]);

function titlesNote(capabilities: Capabilities): string {
  if (capabilities.foregroundApp) {
    return 'A phone has no window titles — only the name of the app in front is recorded.';
  }
  return 'Not on this phone — iPhone does not let apps see other apps.';
}

/** Idle on a desktop means no keys or mouse; a phone can count neither, so it means this. */
function idleNote(capabilities: Capabilities): string {
  if (capabilities.background) {
    return 'On this phone, idle means the screen is off or locked — no phone can count keys or taps.';
  }
  return 'On this phone, idle means the tracker is not on screen.';
}

/** The phone-specific note for one row, or undefined when the setting applies as written. */
function noteFor(id: string, capabilities: Capabilities): string | undefined {
  if (!capabilities.screenshots && SCREENSHOT_ROWS.has(id)) {
    return SCREENSHOT_ROWS.get(id);
  }
  if (id === 'webcam' && !capabilities.webcam) {
    return 'Not on this phone — no photo is taken here.';
  }
  if (id === 'titles') {
    return titlesNote(capabilities);
  }
  if (id === 'idle' && !capabilities.inputCounts) {
    return idleNote(capabilities);
  }
  return undefined;
}

/**
 * The workspace's rows (core's `buildSettingRows`), each annotated when this phone cannot do
 * what it says. The administrator's value is still shown as they set it — hiding it would hide
 * what the same account records on a computer — but a row the phone cannot honour says so,
 * rather than implying it is being done.
 */
export function withPhoneNotes(
  rows: readonly SettingRow[],
  capabilities: Capabilities,
): PhoneSettingRow[] {
  return rows.map((row) => {
    const note = noteFor(row.id, capabilities);
    return note === undefined ? row : { ...row, note };
  });
}
