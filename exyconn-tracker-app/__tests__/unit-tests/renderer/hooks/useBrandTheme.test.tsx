// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Theme } from '@exyconn/ui';
import type { Branding, ThemeMode } from '@shared/types';
import useBrandTheme from '../../../../src/renderer/hooks/useBrandTheme';
import { render, rerender, unmountAll } from '../../test-utils';

const BRANDING: Branding = {
  businessName: 'Acme',
  legalName: 'Acme Ltd',
  slogan: '',
  logoUrl: '',
  logoDarkUrl: '',
  appIconUrl: '',
  faviconUrl: '',
  primaryColor: '#1d4ed8',
  secondaryColor: '#9333ea',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  supportEmail: '',
  websiteUrl: '',
  copyrightText: '',
};

let latest: Theme | null = null;

interface ProbeProps {
  branding: Branding | null;
  mode?: ThemeMode;
}

function Probe({ branding, mode }: Readonly<ProbeProps>): ReactElement {
  latest = useBrandTheme(branding, mode);
  return <span />;
}

function theme(): Theme {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

type ChangeListener = (event: MediaQueryListEvent) => void;

/** A media query the test can flip, the way the OS flips dark mode at dusk. */
function installMatchMedia(initial: boolean): {
  flip: (dark: boolean) => void;
  count: () => number;
} {
  const listeners = new Set<ChangeListener>();
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: (media: string) => ({
      matches: initial,
      media,
      addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
    }),
  });
  return {
    flip: (dark) => {
      for (const listener of listeners) {
        listener({ matches: dark } as MediaQueryListEvent);
      }
    },
    count: () => listeners.size,
  };
}

afterEach(() => {
  unmountAll();
  Reflect.deleteProperty(globalThis, 'matchMedia');
  latest = null;
});

describe('useBrandTheme', () => {
  it('follows the explicit choice, and reads light where the OS cannot be asked', async () => {
    expect(globalThis.matchMedia).toBeUndefined();
    // A white brand ground under "system": nothing says dark, so it is light.
    await render(<Probe branding={BRANDING} />);
    expect(theme().palette.mode).toBe('light');
    await rerender(<Probe branding={BRANDING} mode="dark" />);
    expect(theme().palette.mode).toBe('dark');
  });

  it('keeps notices quiet, so only the live announcer speaks', async () => {
    await render(<Probe branding={BRANDING} mode="light" />);
    expect(theme().components?.MuiAlert?.defaultProps?.role).toBe('none');
  });

  it('follows the OS into and out of dark mode while the app is open', async () => {
    const media = installMatchMedia(true);
    await render(<Probe branding={BRANDING} mode="system" />);
    expect(theme().palette.mode).toBe('dark');
    act(() => media.flip(false));
    expect(theme().palette.mode).toBe('light');
    await rerender(<Probe branding={BRANDING} mode="light" />);
    act(() => media.flip(true));
    expect(theme().palette.mode).toBe('light');
    unmountAll();
    expect(media.count()).toBe(0);
  });

  it('rebuilds only when a colour it reads changes, not on every state tick', async () => {
    await render(<Probe branding={BRANDING} mode="light" />);
    const first = theme();
    await rerender(<Probe branding={{ ...BRANDING, slogan: 'New slogan' }} mode="light" />);
    expect(theme()).toBe(first);
    await rerender(<Probe branding={{ ...BRANDING, primaryColor: '#047857' }} mode="light" />);
    expect(theme()).not.toBe(first);
  });
});
