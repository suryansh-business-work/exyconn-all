import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Linking } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionRow } from '../../../../src/components/permissions/PermissionRow';
import { PermissionsScreen } from '../../../../src/components/permissions/PermissionsScreen';
import { missingPermissions } from '../../../../src/lib/permissions/permission-rows';
import { refreshPermissions, requestPermission } from '../../../../src/tracker/instance';
import type { MobilePermissions } from '../../../../src/tracker/types';
import { renderWithProviders } from '../../test-utils';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES } from '../state';

vi.mock('../../../../src/tracker/instance', () => ({
  refreshPermissions: vi.fn(),
  requestPermission: vi.fn(),
  tracker: { logout: vi.fn() },
}));

const NONE_GRANTED: MobilePermissions = {
  notifications: false,
  usageAccess: false,
  camera: false,
  allGranted: false,
};

const REQUEST_FAILED = 'The phone did not answer the request. Try again, or allow it in Settings.';

function renderScreen(permissions = NONE_GRANTED, capabilities = ANDROID_CAPABILITIES) {
  renderWithProviders(
    <PermissionsScreen
      permissions={permissions}
      capabilities={capabilities}
      status="idle"
      pendingSync={0}
    />,
  );
}

beforeEach(() => {
  vi.mocked(refreshPermissions).mockResolvedValue(undefined);
  vi.mocked(requestPermission).mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('PermissionRow', () => {
  it('says what the grant is, why it is needed and how to give it', () => {
    const [notifications] = missingPermissions(NONE_GRANTED, IOS_CAPABILITIES);
    const onGrant = vi.fn();
    renderWithProviders(
      <PermissionRow permission={notifications} busy={false} loading={false} onGrant={onGrant} />,
    );
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(notifications.reason)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(onGrant).toHaveBeenCalledTimes(1);
  });

  it('waits while another request is in flight, with a spinner on its own', () => {
    const [notifications] = missingPermissions(NONE_GRANTED, IOS_CAPABILITIES);
    renderWithProviders(
      <PermissionRow permission={notifications} busy loading onGrant={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'Allow' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(within(button).getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('PermissionsScreen', () => {
  it('lists every missing grant, one row each', () => {
    renderScreen();
    expect(screen.getByText('Grant permissions')).toBeInTheDocument();
    for (const row of missingPermissions(NONE_GRANTED, ANDROID_CAPABILITIES)) {
      expect(screen.getByText(row.title)).toBeInTheDocument();
    }
  });

  it('leaves out what has already been granted', () => {
    renderScreen({ notifications: true, usageAccess: false, camera: true, allGranted: false });
    expect(screen.queryByText('Notifications')).toBeNull();
    expect(screen.getByText('Usage access')).toBeInTheDocument();
    expect(screen.queryByText('Camera')).toBeNull();
  });

  it('asks the phone for a grant when its button is tapped', async () => {
    renderScreen({ notifications: false, usageAccess: true, camera: true, allGranted: false });
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(requestPermission).toHaveBeenCalledWith('notifications'));
  });

  it('holds every button while one request is in flight', async () => {
    let finish: () => void = () => undefined;
    vi.mocked(requestPermission).mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    renderScreen({ notifications: false, usageAccess: true, camera: true, allGranted: false });
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Re-check' })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: 'Open Settings' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    finish();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Re-check' })).not.toHaveAttribute('aria-disabled'),
    );
  });

  it('re-reads the grants on Re-check', async () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Re-check' }));
    await waitFor(() => expect(refreshPermissions).toHaveBeenCalledTimes(1));
  });

  it('opens the app’s Settings page for a grant with no prompt', async () => {
    renderScreen({ notifications: true, usageAccess: true, camera: true, allGranted: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }));
    await waitFor(() => expect(Linking.openSettings).toHaveBeenCalledTimes(1));
  });

  it('says what to do when the phone does not answer', async () => {
    vi.mocked(refreshPermissions).mockRejectedValue('no answer');
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Re-check' }));
    expect(await screen.findByText(REQUEST_FAILED)).toBeInTheDocument();
  });

  it('offers sign-out, which says what it will do first', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByText('Sign out?')).toBeInTheDocument();
  });
});
