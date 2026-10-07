// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppHeader from '../../../../src/renderer/components/AppHeader';
import {
  button,
  clickElement,
  installTracker,
  render,
  trackerState,
  unmountAll,
} from '../../test-utils';

beforeEach(() => installTracker(trackerState('tracking')));
afterEach(unmountAll);

describe('AppHeader', () => {
  it('titles the page, shows the recording dot and opens settings from the avatar', async () => {
    const onOpenAccount = vi.fn();
    await render(
      <AppHeader
        branding={null}
        title="Dashboard"
        status="tracking"
        user={{ id: 'u1', name: 'Asha Rao', email: 'asha@example.com' }}
        themeMode="light"
        onOpenAccount={onOpenAccount}
      />,
    );
    expect(document.querySelector('h1')?.textContent).toBe('Dashboard');
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Tracking — recording your work',
    );
    const avatar = button('Asha Rao, open settings');
    expect(avatar.textContent).toBe('AR');
    await clickElement(avatar);
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });

  it('names the avatar generically before the account has loaded', async () => {
    await render(
      <AppHeader
        branding={null}
        title="Settings"
        status="idle"
        user={null}
        themeMode="dark"
        onOpenAccount={vi.fn()}
      />,
    );
    expect(button('Signed in, open settings').textContent).toBe('SI');
    expect(button('Theme: Dark. Switch to matching your system.')).toBeDefined();
  });
});
