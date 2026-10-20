import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopbarSearch, searchShortcut } from '@/layout/PortalLayout/TopbarSearch';

/** The shortcut the search icon's tooltip names on a given platform. */
async function shortcutOn(navigatorStub: unknown): Promise<string> {
  vi.stubGlobal('navigator', navigatorStub);
  render(<TopbarSearch onOpen={vi.fn()} />);
  // A plain event: user-event itself reads the navigator this test takes away.
  fireEvent.mouseOver(screen.getByRole('button', { name: 'Search' }));
  return (await screen.findByRole('tooltip')).textContent ?? '';
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the shortcut the topbar search shows', () => {
  it('is Cmd+K on a Mac', async () => {
    expect(await shortcutOn({ platform: 'MacIntel' })).toContain('⌘K');
  });

  it('is Ctrl K everywhere else', async () => {
    expect(await shortcutOn({ platform: 'Win32' })).toContain('Ctrl K');
  });

  it('is Ctrl K when the browser does not say which platform it runs on', async () => {
    expect(await shortcutOn({})).toContain('Ctrl K');
  });

  it('is Ctrl K where there is no navigator at all', async () => {
    vi.stubGlobal('navigator', undefined);
    expect(searchShortcut()).toBe('Ctrl K');
  });
});
