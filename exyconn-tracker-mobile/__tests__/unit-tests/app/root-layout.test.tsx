import { render, screen } from '@testing-library/react';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { deviceTimezone } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RootLayout, { ErrorBoundary } from '../../../src/app/_layout';
import { RootErrorBoundary } from '../../../src/components/shell/RootErrorBoundary';
import { useLogContext } from '../../../src/hooks/useLogContext';
import { useTrackerState } from '../../../src/hooks/useTrackerState';
import { bootTracker } from '../../../src/tracker/instance';
import { run } from '../../../src/tracker/run';
import { scheduleUpdateChecks } from '../../../src/tracker/updates';
import type { MobilePreferences } from '../../../src/tracker/types';
import { branding, trackerState } from '../components/state';

const i18n = vi.hoisted(() => ({ calls: [] as { locale: string | null; timezone: string }[] }));

vi.mock('../../../src/hooks/useTrackerState', () => ({ useTrackerState: vi.fn() }));
vi.mock('../../../src/hooks/useLogContext', () => ({ useLogContext: vi.fn() }));
vi.mock('../../../src/tracker/instance', () => ({ bootTracker: vi.fn() }));
vi.mock('../../../src/tracker/run', () => ({ run: vi.fn() }));
vi.mock('../../../src/tracker/updates', () => ({ scheduleUpdateChecks: vi.fn() }));
vi.mock('../../../src/components/shell/UpdateBanner', () => ({
  UpdateBanner: () => <div data-testid="update-banner" />,
}));
vi.mock('../../../src/components/shell/RootErrorBoundary', () => ({
  RootErrorBoundary: () => <div data-testid="root-error-boundary" />,
}));
vi.mock('../../../src/components/ui/Ground', async () => {
  const { useBrand } = await import('../../../src/theme/BrandProvider');
  return {
    Ground: () => {
      const { groundOpacity, branding } = useBrand();
      return (
        <div
          data-testid="ground"
          data-opacity={groundOpacity}
          data-brand={branding?.businessName ?? 'none'}
        />
      );
    },
  };
});
vi.mock('../../../src/i18n/I18n', () => ({
  TrackerI18nProvider: ({
    locale,
    timezone,
    children,
  }: Readonly<{ locale: string | null; timezone: string; children: ReactNode }>) => {
    i18n.calls.push({ locale, timezone });
    return <>{children}</>;
  },
}));

function preferences(overrides: Partial<MobilePreferences>): MobilePreferences {
  return { ...trackerState().preferences, ...overrides };
}

beforeEach(() => {
  i18n.calls.length = 0;
  vi.mocked(useFonts).mockReturnValue([true, null]);
  vi.mocked(useTrackerState).mockReturnValue(trackerState());
});

describe('RootLayout', () => {
  it('boots the tracker once and spins until the first snapshot lands', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    render(<RootLayout />);
    expect(run).toHaveBeenCalledWith(bootTracker);
    expect(useLogContext).toHaveBeenCalledWith(null);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(scheduleUpdateChecks).toHaveBeenCalledWith(false);
    // Before anybody has signed in, the app reads in the phone's own language and zone.
    expect(i18n.calls.at(-1)).toEqual({ locale: null, timezone: deviceTimezone() });
  });

  it('reads in the employee’s language and zone once the portal has said', () => {
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({ locale: 'hi', timezone: 'Asia/Kolkata' }),
    );
    render(<RootLayout />);
    expect(i18n.calls.at(-1)).toEqual({ locale: 'hi', timezone: 'Asia/Kolkata' });
  });

  it('waits for the font before showing the update banner or a screen', () => {
    vi.mocked(useFonts).mockReturnValue([false, null]);
    render(<RootLayout />);
    expect(screen.queryByTestId('update-banner')).toBeNull();
    expect(screen.queryByTestId('stack')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('opens with the system face when the font fails, and logs why', () => {
    const failure = new Error('font missing');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(useFonts).mockReturnValue([false, failure]);
    render(<RootLayout />);
    expect(log).toHaveBeenCalledWith('The Inter font could not be loaded', failure);
    expect(screen.getByTestId('update-banner')).toBeInTheDocument();
    expect(screen.getByTestId('stack')).toBeInTheDocument();
  });

  it('admits only the sign-in screen while signed out', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'signed-out' }));
    render(<RootLayout />);
    expect(screen.getByTestId('stack-screen-login')).toBeInTheDocument();
    expect(screen.queryByTestId('stack-screen-consent')).toBeNull();
    expect(screen.queryByTestId('stack-screen-permissions')).toBeNull();
    expect(screen.queryByTestId('stack-screen-(app)')).toBeNull();
    expect(scheduleUpdateChecks).toHaveBeenCalledWith(false);
  });

  it('admits only the consent screen while consent is outstanding', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'consent-required' }));
    render(<RootLayout />);
    expect(screen.getByTestId('stack-screen-consent')).toBeInTheDocument();
    expect(screen.queryByTestId('stack-screen-login')).toBeNull();
    expect(screen.queryByTestId('stack-screen-(app)')).toBeNull();
  });

  it('admits only the permissions screen while a grant is missing', () => {
    const permissions = {
      notifications: true,
      usageAccess: false,
      camera: true,
      allGranted: false,
    };
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ permissions }));
    render(<RootLayout />);
    expect(screen.getByTestId('stack-screen-permissions')).toBeInTheDocument();
    expect(screen.queryByTestId('stack-screen-(app)')).toBeNull();
    expect(screen.queryByTestId('stack-screen-login')).toBeNull();
  });

  it('opens the app and the gallery once everything is granted', () => {
    render(<RootLayout />);
    expect(screen.getByTestId('stack-screen-(app)')).toBeInTheDocument();
    expect(screen.getByTestId('stack-screen-screenshots')).toBeInTheDocument();
    expect(screen.queryByTestId('stack-screen-permissions')).toBeNull();
    expect(scheduleUpdateChecks).toHaveBeenCalledWith(true);
  });

  it.each([
    ['a solid ground when see-through is off', preferences({}), '1'],
    [
      'the saved opacity when see-through is on',
      preferences({ transparentBackground: true, backgroundOpacity: 0.8 }),
      '0.8',
    ],
    [
      'no less than half for a value saved under the old floor',
      preferences({ transparentBackground: true, backgroundOpacity: 0.3 }),
      '0.5',
    ],
  ])('paints %s', (_name, prefs, opacity) => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ preferences: prefs }));
    render(<RootLayout />);
    expect(screen.getByTestId('ground').dataset.opacity).toBe(opacity);
  });

  it('paints the workspace’s brand once the portal has sent it', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ branding: branding() }));
    render(<RootLayout />);
    expect(screen.getByTestId('ground').dataset.brand).toBe('Acme Works');
  });

  it('paints the fallback brand before sign-in', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'signed-out' }));
    render(<RootLayout />);
    expect(screen.getByTestId('ground').dataset.brand).toBe('none');
  });

  it('paints a solid ground before the first snapshot', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    render(<RootLayout />);
    expect(screen.getByTestId('ground').dataset.opacity).toBe('1');
  });

  it.each([
    ['dark', 'light'],
    ['light', 'dark'],
  ] as const)('gives a %s theme the %s status bar', (themeMode, style) => {
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({ preferences: preferences({ themeMode }) }),
    );
    render(<RootLayout />);
    expect(screen.getByTestId('status-bar')).toHaveAttribute('content', style);
  });

  it('exports the root error boundary', () => {
    expect(ErrorBoundary).toBe(RootErrorBoundary);
  });
});
