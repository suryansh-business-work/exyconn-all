import { describe, it, expect } from 'vitest';
import { detectPlatform, platformFor } from '../../src/pages/download/detectPlatform';
import { PLATFORMS } from '../../src/pages/download/download.config';

const AGENTS = {
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
  macos: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
  linux: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/133.0',
};

describe('detectPlatform', () => {
  it('picks the build matching the browser', () => {
    expect(detectPlatform(AGENTS.windows).key).toBe('windows');
    expect(detectPlatform(AGENTS.macos).key).toBe('macos');
    expect(detectPlatform(AGENTS.linux).key).toBe('linux');
  });

  it('falls back to the first platform for an unknown agent', () => {
    expect(detectPlatform('curl/8.4.0').key).toBe(PLATFORMS[0].key);
  });
});

describe('platformFor', () => {
  it('resolves a known key and rejects anything else', () => {
    expect(platformFor('macos')?.label).toBe('macOS');
    expect(platformFor('solaris')).toBeNull();
    expect(platformFor(null)).toBeNull();
  });
});

describe('platform config', () => {
  it('gives every platform install steps and requirements', () => {
    for (const platform of PLATFORMS) {
      expect(platform.steps.length).toBeGreaterThan(0);
      expect(platform.permissions.length).toBeGreaterThan(0);
      expect(platform.minOs).not.toBe('');
      expect(platform.recommendedOs).not.toBe('');
    }
  });
});
