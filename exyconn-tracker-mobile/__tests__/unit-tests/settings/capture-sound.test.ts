import { describe, expect, it } from 'vitest';
import { captureSoundCaption, captureSoundLocked } from '../../../src/lib/settings/capture-sound';

const ANDROID = { canCapture: true, mutedByWorkspace: false, muted: false };

describe('captureSoundCaption', () => {
  it('says a shutter plays by default, and that muting changes nothing captured', () => {
    expect(captureSoundCaption(ANDROID)).toMatch(/camera shutter plays/);
  });

  it('keeps the notification promise when this phone is muted', () => {
    expect(captureSoundCaption({ ...ANDROID, muted: true })).toMatch(
      /silently on this phone\. You still get a notification/,
    );
  });

  it('defers to a workspace that has already muted everyone', () => {
    expect(captureSoundCaption({ ...ANDROID, mutedByWorkspace: true, muted: true })).toMatch(
      /workspace has already turned the capture sound off/,
    );
  });

  it('says there is nothing to announce on a phone that takes no screenshots', () => {
    expect(captureSoundCaption({ ...ANDROID, canCapture: false, mutedByWorkspace: true })).toMatch(
      /no captures to announce/,
    );
  });
});

describe('captureSoundLocked', () => {
  it('is the employee’s switch while there is a sound to silence', () => {
    expect(captureSoundLocked(ANDROID)).toBe(false);
    expect(captureSoundLocked({ ...ANDROID, muted: true })).toBe(false);
  });

  it('locks when the workspace muted it or the phone cannot capture', () => {
    expect(captureSoundLocked({ ...ANDROID, mutedByWorkspace: true })).toBe(true);
    expect(captureSoundLocked({ ...ANDROID, canCapture: false })).toBe(true);
  });
});
