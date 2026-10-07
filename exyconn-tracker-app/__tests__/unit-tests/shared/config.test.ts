import { describe, expect, it } from 'vitest';
import { DISCLOSURE_ITEMS, WEBCAM_DISCLOSURE } from '../../../src/shared/config';
import { IPC } from '../../../src/shared/types';

describe('disclosure wording', () => {
  it('lists what is recorded, and promises keystroke content is not', () => {
    expect(DISCLOSURE_ITEMS).toHaveLength(4);
    expect(DISCLOSURE_ITEMS.some((item) => item.includes('never what you type'))).toBe(true);
    expect(DISCLOSURE_ITEMS.some((item) => item.includes('screenshots'))).toBe(true);
  });

  it('states the webcam photo in the app’s own words', () => {
    expect(WEBCAM_DISCLOSURE).toContain('webcam');
    expect(WEBCAM_DISCLOSURE).toContain('only while tracking is on');
  });
});

describe('IPC channels', () => {
  it('gives every command and event its own tracker-namespaced channel', () => {
    const channels = Object.values(IPC);
    expect(new Set(channels).size).toBe(channels.length);
    expect(channels.every((channel) => channel.startsWith('tracker:'))).toBe(true);
  });
});
