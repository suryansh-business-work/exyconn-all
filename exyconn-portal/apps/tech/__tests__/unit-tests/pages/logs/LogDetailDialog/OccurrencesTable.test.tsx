import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OccurrencesTable } from '../../../../../src/pages/logs/LogDetailDialog/OccurrencesTable';
import { renderWithProviders } from '../../../test-utils';
import { logEvent } from '../log.fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../log.fixtures')).settingsModule(),
);

const EVENTS = [
  logEvent(),
  logEvent({
    id: 'evt-2',
    occurredAt: '2026-10-06T09:00:00.000Z',
    userName: '',
    userEmail: 'guest@example.test',
    userVerified: false,
    platform: 'web',
    osVersion: '',
    deviceModel: '',
    appVersion: '',
    route: '',
    ip: '',
    count: 1,
  }),
  logEvent({
    id: 'evt-3',
    occurredAt: '2026-10-05T09:00:00.000Z',
    userId: '',
    userName: '',
    userEmail: '',
    userVerified: false,
    platform: '',
    osVersion: '',
    deviceModel: '',
  }),
];

const cells = (index: number) =>
  within(screen.getAllByRole('row')[index + 1])
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

describe('OccurrencesTable', () => {
  it('lists each occurrence: when, who, device, build, screen, count and address', () => {
    renderWithProviders(<OccurrencesTable events={EVENTS} selectedId="evt-1" onSelect={vi.fn()} />);

    expect(screen.getByRole('table', { name: 'Recent occurrences' })).toBeInTheDocument();
    expect(cells(0)).toEqual([
      'at 2026-10-07T09:00:00.000Z',
      'Asha Rao',
      'android 14 Pixel 8',
      '1.9.7',
      '/timer',
      '4',
      '203.0.113.9',
    ]);
  });

  it('flags a signed-in person the server could not verify, and dashes the rest', () => {
    renderWithProviders(<OccurrencesTable events={EVENTS} selectedId={null} onSelect={vi.fn()} />);

    expect(cells(1)).toEqual([
      'at 2026-10-06T09:00:00.000Z',
      'guest@example.testunverified',
      'web',
      '—',
      '—',
      '1',
      '—',
    ]);
  });

  it('calls a visitor with no account anonymous, without the unverified flag', () => {
    renderWithProviders(<OccurrencesTable events={EVENTS} selectedId={null} onSelect={vi.fn()} />);

    expect(cells(2)[1]).toBe('Anonymous');
    expect(cells(2)[2]).toBe('—');
    expect(screen.getAllByText('unverified')).toHaveLength(1);
  });

  it('marks the picked occurrence and picks another on click', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <OccurrencesTable events={EVENTS} selectedId="evt-1" onSelect={onSelect} />,
    );

    expect(screen.getAllByRole('row')[1]).toHaveClass('Mui-selected');
    expect(screen.getAllByRole('row')[2]).not.toHaveClass('Mui-selected');
    await userEvent.click(screen.getByRole('button', { name: 'at 2026-10-06T09:00:00.000Z' }));
    expect(onSelect).toHaveBeenCalledWith('evt-2');
  });
});
