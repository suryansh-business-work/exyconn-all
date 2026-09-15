import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const handlers = new Map<string, (event: unknown, ...args: unknown[]) => unknown>();
vi.mock('electron', () => ({
  app: { on: vi.fn() },
  ipcMain: {
    handle: (channel: string, fn: (event: unknown, ...args: unknown[]) => unknown) =>
      handlers.set(channel, fn),
    on: vi.fn(),
  },
}));

import { handleTrusted, isAppUrl } from './web-security';

const rendererDir = join('/opt', 'Exyconn Tracker', 'resources', 'out', 'renderer');
const page = (file: string) => pathToFileURL(join(rendererDir, file)).href;

describe('isAppUrl', () => {
  it('accepts the packaged renderer pages, query string included', () => {
    expect(isAppUrl(page('index.html'), undefined, rendererDir)).toBe(true);
    expect(isAppUrl(`${page('screenshots.html')}?start=a&end=b`, undefined, rendererDir)).toBe(
      true,
    );
  });

  it('rejects other local files and remote pages in the packaged app', () => {
    expect(isAppUrl(pathToFileURL('/etc/passwd').href, undefined, rendererDir)).toBe(false);
    expect(isAppUrl(page('../main/index.js'), undefined, rendererDir)).toBe(false);
    expect(isAppUrl('https://evil.example/', undefined, rendererDir)).toBe(false);
    expect(isAppUrl('not a url', undefined, rendererDir)).toBe(false);
  });

  it('accepts only the dev server origin in development', () => {
    const dev = 'http://localhost:4005';
    expect(isAppUrl('http://localhost:4005/screenshots.html', dev, rendererDir)).toBe(true);
    expect(isAppUrl('http://localhost:4006/', dev, rendererDir)).toBe(false);
    expect(isAppUrl(page('index.html'), dev, rendererDir)).toBe(false);
  });
});

describe('handleTrusted', () => {
  it('refuses a call from a frame that is not an app page', () => {
    const listener = vi.fn(() => 'ok');
    handleTrusted('probe', listener);
    const call = handlers.get('probe');

    expect(() => call?.({ senderFrame: { url: 'https://evil.example/' } })).toThrow(/untrusted/);
    expect(() => call?.({ senderFrame: null })).toThrow(/untrusted/);
    expect(listener).not.toHaveBeenCalled();
  });
});
