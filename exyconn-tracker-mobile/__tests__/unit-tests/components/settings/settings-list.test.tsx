import { screen } from '@testing-library/react';
import type { WorkProfile } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { SettingsCard } from '../../../../src/components/settings/SettingsCard';
import { SettingsList } from '../../../../src/components/settings/SettingsList';
import { WorkArrangementCard } from '../../../../src/components/settings/WorkArrangementCard';
import type { PhoneSettingRow } from '../../../../src/lib/settings/phone-notes';
import { renderWithProviders } from '../../test-utils';

const NOTE = 'Not on this phone — it takes no screenshots.';

const ROWS: PhoneSettingRow[] = [
  { id: 'interval', label: 'Tracking interval', value: '10 minutes' },
  { id: 'blur', label: 'Blur screenshots', value: 'Yes', note: NOTE },
];

const PROFILE: WorkProfile = {
  workingTime: 'FLEXIBLE',
  workingTimeNote: '',
  workLocation: 'OTHER',
  workLocationNote: 'Client site on Fridays',
  workHoursPerDay: 7.5,
  targetMs: 7.5 * 3_600_000,
};

describe('SettingsCard', () => {
  it('heads its content with a title and the line explaining it', () => {
    renderWithProviders(
      <SettingsCard title="Settings" description="Set by your administrator.">
        <span>Card body</span>
      </SettingsCard>,
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Set by your administrator.')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('leaves the explanation out when there is none', () => {
    renderWithProviders(
      <SettingsCard title="About">
        <span>Card body</span>
      </SettingsCard>,
    );

    const title = screen.getByText('About');
    // Only the title sits in the heading block.
    expect(title.parentElement?.children).toHaveLength(1);
  });
});

describe('SettingsList', () => {
  it('shows every label beside its value', () => {
    renderWithProviders(<SettingsList rows={ROWS} />);

    expect(screen.getByText('Tracking interval')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('Blur screenshots')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('notes only the rows this phone cannot honour', () => {
    renderWithProviders(<SettingsList rows={ROWS} />);

    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-cellphone-information')).toHaveLength(1);
  });

  it('writes the phone’s note in the employee’s language', () => {
    renderWithProviders(<SettingsList rows={ROWS} />, {
      messages: { [NOTE]: 'Nicht auf diesem Telefon.' },
    });

    expect(screen.getByText('Nicht auf diesem Telefon.')).toBeInTheDocument();
  });
});

describe('WorkArrangementCard', () => {
  it('shows nothing until HR has set a working day', () => {
    renderWithProviders(<WorkArrangementCard workProfile={null} />);

    expect(screen.queryByText('Your working day')).not.toBeInTheDocument();
  });

  it('lists the hours and place HR contracted, with HR’s own note', () => {
    renderWithProviders(<WorkArrangementCard workProfile={PROFILE} />);

    expect(screen.getByText('Your working day')).toBeInTheDocument();
    expect(screen.getByText('Flexible')).toBeInTheDocument();
    expect(screen.getByText('Other — Client site on Fridays')).toBeInTheDocument();
    expect(screen.getByText('7.5h (default 8h)')).toBeInTheDocument();
  });
});
