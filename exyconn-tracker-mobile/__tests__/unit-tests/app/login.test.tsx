import { screen } from '@testing-library/react';
import { copyrightNotice } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginScreen, { ErrorBoundary } from '../../../src/app/login';
import { ScreenErrorBoundary } from '../../../src/components/shell/ScreenErrorBoundary';
import { useTrackerState } from '../../../src/hooks/useTrackerState';
import { renderWithProviders } from '../test-utils';
import { trackerState } from '../components/state';
import { propsOf } from './stub';

vi.mock('../../../src/hooks/useTrackerState', () => ({ useTrackerState: vi.fn() }));
vi.mock('../../../src/forms/login', async () => ({
  LoginForm: (await import('./stub')).stub('login-form'),
}));
vi.mock('../../../src/components/shell/ThemeToggle', async () => ({
  ThemeToggle: (await import('./stub')).stub('theme-toggle'),
}));
vi.mock('../../../src/components/shell/ScreenErrorBoundary', async () => ({
  ScreenErrorBoundary: (await import('./stub')).stub('screen-error-boundary'),
}));

beforeEach(() => {
  vi.mocked(useTrackerState).mockReturnValue(trackerState({ status: 'signed-out' }));
});

describe('LoginScreen', () => {
  it('renders nothing before the first state snapshot', () => {
    vi.mocked(useTrackerState).mockReturnValue(null);
    renderWithProviders(<LoginScreen />);
    expect(screen.queryByText('Sign in')).toBeNull();
    expect(screen.queryByTestId('login-form')).toBeNull();
  });

  it('asks for portal credentials, remembering the last choice', () => {
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({ status: 'signed-out', rememberMe: false }),
    );
    renderWithProviders(<LoginScreen />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Use your Exyconn portal email and password.')).toBeInTheDocument();
    expect(propsOf(screen.getByTestId('login-form'))).toEqual({ rememberMe: false });
  });

  it('offers the theme switch in the current mode', () => {
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({
        status: 'signed-out',
        preferences: { ...trackerState().preferences, themeMode: 'dark' },
      }),
    );
    renderWithProviders(<LoginScreen />);
    expect(propsOf(screen.getByTestId('theme-toggle'))).toEqual({ mode: 'dark' });
  });

  it('says nothing about a sign-out the employee chose themselves', () => {
    renderWithProviders(<LoginScreen />);
    expect(screen.queryByText(/access/i)).toBeNull();
  });

  it('tells the employee why the app signed them out on its own', () => {
    const reason = 'Your access to the tracker was revoked.';
    vi.mocked(useTrackerState).mockReturnValue(
      trackerState({ status: 'signed-out', signedOutReason: reason }),
    );
    renderWithProviders(<LoginScreen />);
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('shows the workspace’s copyright line', () => {
    renderWithProviders(<LoginScreen />);
    expect(screen.getByText(copyrightNotice(null))).toBeInTheDocument();
  });

  it('exports the screen error boundary', () => {
    expect(ErrorBoundary).toBe(ScreenErrorBoundary);
  });
});
