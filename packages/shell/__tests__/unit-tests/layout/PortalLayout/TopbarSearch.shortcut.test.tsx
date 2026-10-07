import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopbarSearch } from '@/layout/PortalLayout/TopbarSearch';

function shortcutOn(navigatorStub: unknown): string {
  vi.stubGlobal('navigator', navigatorStub);
  render(<TopbarSearch onOpen={vi.fn()} />);
  return screen.getByRole('button').textContent ?? '';
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the shortcut the topbar search shows', () => {
  it('is Cmd+K on a Mac', () => {
    expect(shortcutOn({ platform: 'MacIntel' })).toContain('⌘K');
  });

  it('is Ctrl K everywhere else', () => {
    expect(shortcutOn({ platform: 'Win32' })).toContain('Ctrl K');
  });

  it('is Ctrl K when the browser does not say which platform it runs on', () => {
    expect(shortcutOn({})).toContain('Ctrl K');
  });

  it('is Ctrl K where there is no navigator at all', () => {
    expect(shortcutOn(undefined)).toContain('Ctrl K');
  });
});
