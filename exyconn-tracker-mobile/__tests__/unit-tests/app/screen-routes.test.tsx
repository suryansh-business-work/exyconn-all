import { render, screen } from '@testing-library/react';
import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../../../src/app/(app)/dashboard';
import MessagesRoute from '../../../src/app/(app)/messages';
import OffComputerRoute from '../../../src/app/(app)/off-computer';
import ReportRoute from '../../../src/app/(app)/report';
import SettingsRoute from '../../../src/app/(app)/settings';
import ConsentRoute from '../../../src/app/consent';
import Index from '../../../src/app/index';
import PermissionsRoute from '../../../src/app/permissions';
import ScreenshotsRoute from '../../../src/app/screenshots';
import { useTrackerState } from '../../../src/hooks/useTrackerState';
import { ANDROID_CAPABILITIES, trackerState } from '../components/state';
import { propsOf } from './stub';

vi.mock('../../../src/hooks/useTrackerState', () => ({ useTrackerState: vi.fn() }));
vi.mock('../../../src/tracker/platform', async () => ({
  capabilities: (await import('../components/state')).ANDROID_CAPABILITIES,
}));
vi.mock('../../../src/components/shell/ScreenErrorBoundary', async () => ({
  ScreenErrorBoundary: (await import('./stub')).stub('screen-error-boundary'),
}));
vi.mock('../../../src/components/dashboard/DashboardScreen', async () => ({
  DashboardScreen: (await import('./stub')).stub('dashboard-screen'),
}));
vi.mock('../../../src/components/messages/MessagesScreen', async () => ({
  MessagesScreen: (await import('./stub')).stub('messages-screen'),
}));
vi.mock('../../../src/components/off-computer/OffComputerScreen', async () => ({
  OffComputerScreen: (await import('./stub')).stub('off-computer-screen'),
}));
vi.mock('../../../src/components/report/MyReportScreen', async () => ({
  MyReportScreen: (await import('./stub')).stub('report-screen'),
}));
vi.mock('../../../src/components/settings/SettingsScreen', async () => ({
  SettingsScreen: (await import('./stub')).stub('settings-screen'),
}));
vi.mock('../../../src/components/consent/ConsentScreen', async () => ({
  ConsentScreen: (await import('./stub')).stub('consent-screen'),
}));
vi.mock('../../../src/components/permissions/PermissionsScreen', async () => ({
  PermissionsScreen: (await import('./stub')).stub('permissions-screen'),
}));
vi.mock('../../../src/components/screenshots/ScreenshotsScreen', async () => ({
  ScreenshotsScreen: (await import('./stub')).stub('screenshots-screen'),
}));

const state = trackerState({
  timezone: 'Asia/Kolkata',
  projects: [{ id: 'p1', name: 'Global Project', key: 'GLB' }],
});

beforeEach(() => {
  vi.mocked(useTrackerState).mockReturnValue(state);
  vi.mocked(useLocalSearchParams).mockReturnValue({});
});

const ROUTES: [string, ComponentType, string][] = [
  ['dashboard', Dashboard, 'dashboard-screen'],
  ['messages', MessagesRoute, 'messages-screen'],
  ['off-computer', OffComputerRoute, 'off-computer-screen'],
  ['report', ReportRoute, 'report-screen'],
  ['settings', SettingsRoute, 'settings-screen'],
  ['consent', ConsentRoute, 'consent-screen'],
  ['permissions', PermissionsRoute, 'permissions-screen'],
  ['screenshots', ScreenshotsRoute, 'screenshots-screen'],
];

describe('screen routes', () => {
  it.each(ROUTES)('%s renders nothing before the first state snapshot', (_name, Route, id) => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    const { container } = render(<Route />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId(id)).toBeNull();
  });

  it('hands the dashboard the whole live state', () => {
    render(<Dashboard />);
    expect(propsOf(screen.getByTestId('dashboard-screen'))).toEqual({ state });
  });

  it('hands the settings screen the whole live state', () => {
    render(<SettingsRoute />);
    expect(propsOf(screen.getByTestId('settings-screen'))).toEqual({ state });
  });

  it.each([
    ['messages', MessagesRoute, 'messages-screen'],
    ['report', ReportRoute, 'report-screen'],
  ] as const)('reads %s in the employee’s own zone', (_name, Route, id) => {
    render(<Route />);
    expect(propsOf(screen.getByTestId(id))).toEqual({ timezone: 'Asia/Kolkata' });
  });

  it('gives off-computer time the projects to book against', () => {
    render(<OffComputerRoute />);
    expect(propsOf(screen.getByTestId('off-computer-screen'))).toEqual({
      projects: state.projects,
      timezone: 'Asia/Kolkata',
    });
  });

  it('gives the consent screen the settings, the policy and what this phone can do', () => {
    render(<ConsentRoute />);
    expect(propsOf(screen.getByTestId('consent-screen'))).toEqual({
      settings: state.settings,
      policy: null,
      capabilities: ANDROID_CAPABILITIES,
    });
  });

  it('gives the permissions screen the grants, the status and the outbox size', () => {
    const waiting = trackerState({ stats: { ...state.stats, pendingSync: 4 } });
    vi.mocked(useTrackerState).mockReturnValue(waiting);
    render(<PermissionsRoute />);
    expect(propsOf(screen.getByTestId('permissions-screen'))).toEqual({
      permissions: waiting.permissions,
      capabilities: ANDROID_CAPABILITIES,
      status: 'idle',
      pendingSync: 4,
    });
  });

  it('passes the gallery the params it was opened with', () => {
    const params = { start: '2026-10-05T00:00:00.000Z', end: '2026-10-06T00:00:00.000Z' };
    vi.mocked(useLocalSearchParams).mockReturnValue(params);
    render(<ScreenshotsRoute />);
    expect(propsOf(screen.getByTestId('screenshots-screen'))).toEqual({
      params,
      timezone: 'Asia/Kolkata',
    });
  });
});

describe('index route', () => {
  function target(): string | undefined {
    return screen.getByTestId('redirect').dataset.href;
  }

  it('sends a launch with no state yet to sign-in', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    render(<Index />);
    expect(target()).toBe('/login');
  });

  it('sends a signed-out phone to sign-in', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'signed-out' }));
    render(<Index />);
    expect(target()).toBe('/login');
  });

  it('sends a phone awaiting consent to the consent screen', () => {
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'consent-required' }));
    render(<Index />);
    expect(target()).toBe('/consent');
  });

  it('sends a phone missing a grant to the permissions screen', () => {
    const permissions = {
      notifications: false,
      usageAccess: true,
      camera: true,
      allGranted: false,
    };
    vi.mocked(useTrackerState).mockReturnValue(trackerState({ permissions }));
    render(<Index />);
    expect(target()).toBe('/permissions');
  });

  it('sends a ready phone to the dashboard', () => {
    render(<Index />);
    expect(target()).toBe('/dashboard');
  });
});

describe('route error boundaries', () => {
  it('every screen exports the screen error boundary', async () => {
    const modules = await Promise.all([
      import('../../../src/app/(app)/dashboard'),
      import('../../../src/app/(app)/messages'),
      import('../../../src/app/(app)/off-computer'),
      import('../../../src/app/(app)/report'),
      import('../../../src/app/(app)/settings'),
      import('../../../src/app/consent'),
      import('../../../src/app/index'),
      import('../../../src/app/permissions'),
      import('../../../src/app/screenshots'),
    ]);
    const { ScreenErrorBoundary } =
      await import('../../../src/components/shell/ScreenErrorBoundary');
    for (const route of modules) {
      expect(route.ErrorBoundary).toBe(ScreenErrorBoundary);
    }
  });
});
