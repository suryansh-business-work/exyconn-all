import { describe, expect, it } from 'vitest';
import type { SettingRow } from '@exyconn/tracker-core';
import type { Capabilities } from '../../../src/tracker/types';
import { withPhoneNotes } from '../../../src/lib/settings/phone-notes';

const ANDROID: Capabilities = {
  screenshots: true,
  foregroundApp: true,
  inputCounts: false,
  webcam: true,
  background: true,
};

const IOS: Capabilities = {
  screenshots: false,
  foregroundApp: false,
  inputCounts: false,
  webcam: false,
  background: false,
};

const ROWS: SettingRow[] = [
  'interval',
  'screenshots',
  'randomize',
  'quality',
  'blur',
  'webcam',
  'titles',
  'idle',
  'auto-pause',
  'capture-sound',
  'schedule',
  'sync',
].map((id) => ({ id, label: id, value: 'x' }));

function notesOf(capabilities: Capabilities): Record<string, string | undefined> {
  return Object.fromEntries(withPhoneNotes(ROWS, capabilities).map((row) => [row.id, row.note]));
}

describe('withPhoneNotes', () => {
  it('keeps every row and its value as the administrator set it', () => {
    const rows = withPhoneNotes(ROWS, IOS);
    expect(rows.map((row) => [row.id, row.value])).toEqual(ROWS.map((row) => [row.id, 'x']));
  });

  it('notes every screenshot setting as moot on a phone that cannot capture', () => {
    const notes = notesOf(IOS);
    expect(notes.screenshots).toMatch(/iPhone does not let apps capture the screen/);
    for (const id of ['randomize', 'quality', 'blur']) {
      expect(notes[id]).toMatch(/takes no screenshots/);
    }
    expect(notes['capture-sound']).toMatch(/no captures to announce/);
    expect(notes.webcam).toMatch(/no photo is taken/);
    expect(notes.titles).toMatch(/does not let apps see other apps/);
    expect(notes.idle).toMatch(/tracker is not on screen/);
  });

  it('leaves the screenshot rows alone on a phone that captures', () => {
    const notes = notesOf(ANDROID);
    for (const id of ['screenshots', 'randomize', 'quality', 'blur', 'capture-sound', 'webcam']) {
      expect(notes[id]).toBeUndefined();
    }
  });

  it('explains what titles and idle mean on a phone that sees the app in front', () => {
    const notes = notesOf(ANDROID);
    expect(notes.titles).toMatch(/only the name of the app in front/);
    expect(notes.idle).toMatch(/screen is off or locked/);
  });

  it('never notes the rows that apply on every phone', () => {
    for (const capabilities of [ANDROID, IOS]) {
      const notes = notesOf(capabilities);
      for (const id of ['interval', 'auto-pause', 'schedule', 'sync']) {
        expect(notes[id]).toBeUndefined();
      }
    }
  });
});
