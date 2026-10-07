import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useListUsersQuery, useTrackerProjectOptionsQuery } from '@exyconn/shell/graphql/generated';
import { AttendanceFilters } from '../../../../../src/pages/hr/attendance/AttendanceFilters';
import {
  EMPTY_ATTENDANCE_FILTERS,
  type AttendanceFilterState,
} from '../../../../../src/pages/hr/attendance/attendance.filters';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../../../harness/gql-doubles';
import { chooseOption, combobox, optionsOf, press } from '../../../harness/form-fields';
import { PICKED_DAY } from '../../../harness/date-picker-stub';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListUsersQuery: vi.fn(),
  useTrackerProjectOptionsQuery: vi.fn(),
}));

vi.mock('@exyconn/ui/pickers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/ui/pickers')>()),
  DatePicker: (await import('../../../harness/date-picker-stub')).DatePickerStub,
}));

function renderFilters(patch: Partial<AttendanceFilterState> = {}) {
  const onChange = vi.fn();
  const value = { ...EMPTY_ATTENDANCE_FILTERS, ...patch };
  renderWithProviders(<AttendanceFilters value={value} onChange={onChange} />);
  return { onChange, value };
}

beforeEach(() => {
  vi.mocked(useListUsersQuery).mockReturnValue(
    queryResult({
      listUsers: [
        { id: 'u1', name: 'Asha Rao' },
        { id: 'u2', name: 'Bilal Khan' },
      ],
    }) as never,
  );
  vi.mocked(useTrackerProjectOptionsQuery).mockReturnValue(
    queryResult({
      trackerProjectOptions: [
        { id: 'p1', name: 'Website', key: 'WEB' },
        { id: 'p2', name: 'Internal', key: '' },
      ],
    }) as never,
  );
});

describe('AttendanceFilters status', () => {
  it('offers any status and every attendance status, in words', async () => {
    renderFilters();
    expect(await optionsOf('Status')).toEqual([
      'All statuses',
      'ABSENT',
      'HALF DAY',
      'PRESENT',
      'WFH',
    ]);
  });

  it('narrows to one status', async () => {
    const { onChange } = renderFilters({ employeeId: 'u2' });
    await chooseOption('Status', 'HALF DAY');
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_ATTENDANCE_FILTERS,
      employeeId: 'u2',
      status: 'HALF_DAY',
    });
  });
});

describe('AttendanceFilters people and projects', () => {
  it('offers the employees by name and the projects with their key', async () => {
    renderFilters();
    expect(await optionsOf('Employee')).toEqual(['Asha Rao', 'Bilal Khan']);
    expect(await optionsOf('Project')).toEqual(['WEB · Website', 'Internal']);
  });

  it('narrows to one employee and one project by id', async () => {
    const { onChange } = renderFilters();
    await chooseOption('Employee', 'Bilal Khan');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_ATTENDANCE_FILTERS, employeeId: 'u2' });
    await chooseOption('Project', 'WEB · Website');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_ATTENDANCE_FILTERS, projectId: 'p1' });
  });

  it('shows the chosen employee and clears back to any', async () => {
    const { onChange } = renderFilters({ employeeId: 'u1' });
    expect(combobox('Employee')).toHaveValue('Asha Rao');
    await userEvent.clear(combobox('Employee'));
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_ATTENDANCE_FILTERS);
  });

  it('shows nothing for an id no longer in the list', () => {
    renderFilters({ projectId: 'gone' });
    expect(combobox('Project')).toHaveValue('');
  });

  it('offers no options before the lists arrive', async () => {
    vi.mocked(useListUsersQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useTrackerProjectOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    renderFilters();
    await userEvent.click(combobox('Employee'));
    expect(await screen.findByText('No options')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

describe('AttendanceFilters dates', () => {
  it('picks and clears the range ends', async () => {
    const { onChange } = renderFilters();
    expect(screen.queryByText(/^earliest/)).not.toBeInTheDocument();
    await press('Pick From');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_ATTENDANCE_FILTERS, from: PICKED_DAY });
    await press('Pick To');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_ATTENDANCE_FILTERS, to: PICKED_DAY });
  });

  it('starts the To calendar at From, and clears a picked day', async () => {
    const from = new Date(2026, 2, 1);
    const { onChange } = renderFilters({ from, to: new Date(2026, 2, 20) });
    expect(screen.getByText(`earliest ${from.toISOString()}`)).toBeInTheDocument();
    expect(screen.queryByText('Must be on or after From')).not.toBeInTheDocument();
    await press('Clear To');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_ATTENDANCE_FILTERS, from, to: null });
  });

  it('flags a To that comes before From', () => {
    renderFilters({ from: new Date(2026, 2, 20), to: new Date(2026, 2, 10) });
    expect(screen.getByText('Must be on or after From')).toBeInTheDocument();
  });
});

describe('AttendanceFilters clear', () => {
  it('has nothing to clear while no filter is set', () => {
    renderFilters();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('clears every filter at once', async () => {
    const { onChange } = renderFilters({ status: 'WFH', to: new Date(2026, 2, 10) });
    await press('Clear filters');
    expect(onChange).toHaveBeenCalledWith(EMPTY_ATTENDANCE_FILTERS);
  });
});
