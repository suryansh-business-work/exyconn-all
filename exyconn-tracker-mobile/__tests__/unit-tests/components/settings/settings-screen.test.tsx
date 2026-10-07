import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsScreen } from '../../../../src/components/settings/SettingsScreen';
import { renderWithProviders } from '../../test-utils';
import { Linking } from '../../mocks/react-native/apis';
import { stats } from '../../dashboard/fixtures';
import { trackerState } from '../state';

// The cards have their own tests; here each only shows the slice of state it was handed.
vi.mock('../../../../src/components/settings/TimezonePicker', () => ({
  TimezonePicker: ({ timezone }: Readonly<{ timezone: string }>) => (
    <span>{`zone ${timezone}`}</span>
  ),
}));
vi.mock('../../../../src/components/settings/ThisPhoneCard', () => ({
  ThisPhoneCard: ({ preferences }: Readonly<{ preferences: { themeMode: string } }>) => (
    <span>{`this phone, ${preferences.themeMode} theme`}</span>
  ),
}));
vi.mock('../../../../src/components/settings/WorkArrangementCard', () => ({
  WorkArrangementCard: ({ workProfile }: Readonly<{ workProfile: unknown }>) => (
    <span>{workProfile === null ? 'no working day' : 'working day'}</span>
  ),
}));
vi.mock('../../../../src/components/settings/WorkspaceSettingsCard', () => ({
  WorkspaceSettingsCard: ({ settings }: Readonly<{ settings: unknown }>) => (
    <span>{settings === null ? 'no workspace settings' : 'workspace settings'}</span>
  ),
}));
vi.mock('../../../../src/components/settings/CapabilityCard', () => ({
  CapabilityCard: () => <span>capabilities</span>,
}));
vi.mock('../../../../src/components/settings/AboutCard', () => ({
  AboutCard: ({ branding }: Readonly<{ branding: unknown }>) => (
    <span>{branding === null ? 'about, unbranded' : 'about, branded'}</span>
  ),
}));
vi.mock('../../../../src/components/shell/SignOutButton', () => ({
  SignOutButton: ({ status, pendingSync }: Readonly<{ status: string; pendingSync: number }>) => (
    <span>{`sign out from ${status} with ${pendingSync} waiting`}</span>
  ),
}));

describe('SettingsScreen', () => {
  it('puts the employee’s own zone first, then the app, then what others set', () => {
    renderWithProviders(<SettingsScreen state={trackerState({ timezone: 'Asia/Kolkata' })} />);

    expect(screen.getByText('Your timezone')).toBeInTheDocument();
    expect(
      screen.getByText('Your workspace sets a default. Pick your own if you work somewhere else.'),
    ).toBeInTheDocument();
    const zone = screen.getByText('zone Asia/Kolkata');
    const app = screen.getByText('this phone, light theme');
    const workspace = screen.getByText('workspace settings');
    expect(zone.compareDocumentPosition(app) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(app.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('no working day')).toBeInTheDocument();
    expect(screen.getByText('capabilities')).toBeInTheDocument();
    expect(screen.getByText('about, unbranded')).toBeInTheDocument();
  });

  it('opens the employee’s data in the portal', () => {
    renderWithProviders(<SettingsScreen state={trackerState()} />);

    expect(
      screen.getByText(
        'Everything this app has recorded about you is visible to you in the portal.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View my data in the portal' }));

    expect(Linking.openURL).toHaveBeenCalledWith('https://portal.example.test/me/tracker');
  });

  it('signs out knowing what is running and what is still waiting to upload', () => {
    renderWithProviders(
      <SettingsScreen
        state={trackerState({ status: 'tracking', stats: stats({ pendingSync: 3 }) })}
      />,
    );

    expect(screen.getByText('sign out from tracking with 3 waiting')).toBeInTheDocument();
  });
});
