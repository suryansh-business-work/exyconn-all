import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { useMyHolidaysQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { HolidaysPage } from '../../../../src/pages/employee/HolidaysPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyHolidaysQuery: vi.fn(),
}));

// Local-time strings, so the weekday column reads the same in every timezone.
const holidays = [
  {
    id: 'h1',
    name: 'Republic Day',
    date: '2026-01-26T00:00:00',
    type: 'PUBLIC',
    description: 'National holiday',
  },
  { id: 'h2', name: 'Holi', date: '2026-03-04T00:00:00', type: 'OPTIONAL', description: null },
];

describe('HolidaysPage', () => {
  it('lists each holiday with its date, weekday, type and description', () => {
    vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult({ data: { myHolidays: holidays } }));
    renderWithProviders(<HolidaysPage />);

    const [, republic, holi] = screen.getAllByRole('row');
    expect(within(republic).getByText('Republic Day')).toBeInTheDocument();
    expect(within(republic).getByText('on 2026-01-26T00:00:00')).toBeInTheDocument();
    expect(within(republic).getByText('Monday')).toBeInTheDocument();
    expect(within(republic).getByText('PUBLIC')).toBeInTheDocument();
    expect(within(republic).getByText('National holiday')).toBeInTheDocument();

    expect(within(holi).getByText('Wednesday')).toBeInTheDocument();
    expect(within(holi).getByText('OPTIONAL')).toBeInTheDocument();
    expect(within(holi).getByText('—')).toBeInTheDocument();
  });

  it('says none are published yet when the list is empty', () => {
    vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult({ data: { myHolidays: [] } }));
    renderWithProviders(<HolidaysPage />);
    expect(screen.getByText('No holidays published yet.')).toBeInTheDocument();
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyHolidaysQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<HolidaysPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No holidays published yet.')).toBeNull();
  });
});
