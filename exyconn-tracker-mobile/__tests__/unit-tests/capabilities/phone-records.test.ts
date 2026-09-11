import { describe, expect, it } from 'vitest';
import {
  PHONE_WEBCAM_DISCLOSURE,
  phoneRecords,
  showsWebcamDisclosure,
} from '../../../src/lib/capabilities/phone-records';
import type { Capabilities } from '../../../src/tracker/types';

const ANDROID: Capabilities = {
  screenshots: true,
  foregroundApp: true,
  inputCounts: false,
  webcam: true,
  background: true,
};

const IPHONE: Capabilities = {
  screenshots: false,
  foregroundApp: false,
  inputCounts: false,
  webcam: false,
  background: false,
};

const SETTINGS = { screenshotsPerInterval: 1, blurScreenshots: false, webcamEnabled: false };

function recorded(capabilities: Capabilities, settings = SETTINGS): Record<string, boolean> {
  return Object.fromEntries(
    phoneRecords(capabilities, settings).map((line) => [line.id, line.recorded]),
  );
}

describe('phoneRecords', () => {
  it('lists the same five questions on every phone, in one order', () => {
    const order = ['time', 'input', 'apps', 'screenshots', 'webcam'];
    expect(phoneRecords(ANDROID, SETTINGS).map((line) => line.id)).toEqual(order);
    expect(phoneRecords(IPHONE, null).map((line) => line.id)).toEqual(order);
  });

  it('on Android records time, the app in front and screenshots — never keys or taps', () => {
    expect(recorded(ANDROID)).toEqual({
      time: true,
      input: false,
      apps: true,
      screenshots: true,
      webcam: false,
    });
  });

  it('on an iPhone records time and nothing else, and says why', () => {
    expect(recorded(IPHONE)).toEqual({
      time: true,
      input: false,
      apps: false,
      screenshots: false,
      webcam: false,
    });
    const lines = phoneRecords(IPHONE, SETTINGS);
    expect(lines[0].detail).toContain('iPhone');
    expect(lines[2].detail).toBe('iPhone doesn’t allow apps to see other apps.');
    expect(lines[3].title).toBe('Screenshots — not on iPhone');
  });

  it('never claims to count key presses or taps', () => {
    for (const capabilities of [ANDROID, IPHONE]) {
      const input = phoneRecords(capabilities, SETTINGS)[1];
      expect(input.recorded).toBe(false);
      expect(input.title).toContain('never');
    }
  });

  it('says so when the workspace takes no screenshots', () => {
    const off = { ...SETTINGS, screenshotsPerInterval: 0 };
    expect(recorded(ANDROID, off).screenshots).toBe(false);
    expect(phoneRecords(ANDROID, off)[3].title).toBe('Screenshots — switched off');
    expect(phoneRecords(ANDROID, null)[3].recorded).toBe(false);
  });

  it('mentions blurring only when the workspace blurs', () => {
    expect(phoneRecords(ANDROID, SETTINGS)[3].detail).not.toContain('blurred');
    const blurred = { ...SETTINGS, blurScreenshots: true };
    expect(phoneRecords(ANDROID, blurred)[3].detail).toContain('blurred before upload');
  });
});

describe('the camera line', () => {
  it('is recorded only when the workspace turned it on and the phone can take one', () => {
    const on = { ...SETTINGS, webcamEnabled: true };
    expect(recorded(ANDROID, on).webcam).toBe(true);
    expect(phoneRecords(ANDROID, SETTINGS)[4].title).toBe('Camera photos — switched off');
    expect(phoneRecords(IPHONE, on)[4]).toMatchObject({ recorded: false });
  });
});

describe('showsWebcamDisclosure', () => {
  it('shows only when the workspace has it on and the phone can take one', () => {
    const on = { ...SETTINGS, webcamEnabled: true };
    expect(showsWebcamDisclosure(ANDROID, on)).toBe(true);
    expect(showsWebcamDisclosure(ANDROID, SETTINGS)).toBe(false);
    expect(showsWebcamDisclosure(IPHONE, on)).toBe(false);
    expect(showsWebcamDisclosure(ANDROID, null)).toBe(false);
  });

  it('speaks of the phone’s front camera, not a webcam', () => {
    expect(PHONE_WEBCAM_DISCLOSURE).toContain('front camera');
    expect(PHONE_WEBCAM_DISCLOSURE).not.toContain('webcam');
  });
});
