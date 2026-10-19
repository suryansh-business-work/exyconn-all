import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingsPage } from '../../../../src/pages/meetings';
import { MEETINGS_PATH } from '../../../../src/pages/meetings/MeetingsPage';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../form-stub';

// Each panel has its own tests; here they only mark which tab is showing.
vi.mock('../../../../src/pages/meetings/MeetingTypesPanel', () => ({
  MeetingTypesPanel: () => <p>Types panel</p>,
}));
vi.mock('../../../../src/pages/meetings/BookingsPanel', () => ({
  BookingsPanel: () => <p>Bookings panel</p>,
}));
vi.mock('../../../../src/pages/meetings/tracking/TrackingPanel', () => ({
  TrackingPanel: () => <p>Tracking panel</p>,
}));
vi.mock('../../../../src/pages/meetings/MeetingSettingsPanel', () => ({
  MeetingSettingsPanel: () => <p>Settings panel</p>,
}));

function renderAt(route: string) {
  renderWithProviders(
    <>
      <MeetingsPage />
      <UrlProbe />
    </>,
    { route },
  );
}

describe('MeetingsPage', () => {
  it('opens on the meeting types tab at the bare address', async () => {
    renderAt(MEETINGS_PATH);

    expect(await screen.findByText('Types panel')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/meetings/types');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Meeting types',
      'Bookings',
      'Tracking',
      'Settings',
    ]);
  });

  it('opens the tab its address names and moves between tabs by URL', async () => {
    renderAt('/meetings/tracking');
    expect(screen.getByText('Tracking panel')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByText('Settings panel')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/meetings/settings');

    await userEvent.click(screen.getByRole('tab', { name: 'Bookings' }));
    expect(screen.getByText('Bookings panel')).toBeInTheDocument();
  });
});
