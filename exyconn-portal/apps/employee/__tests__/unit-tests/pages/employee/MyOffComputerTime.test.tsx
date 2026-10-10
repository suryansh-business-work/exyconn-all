import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MyTrackerManualEntriesDocument,
  useMyTrackerManualEntriesQuery,
  useWithdrawTrackerManualEntryMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult } from './helpers/apollo';
import { entries } from './helpers/offComputer';
import { MyOffComputerTime } from '../../../../src/pages/employee/MyOffComputerTime';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyTrackerManualEntriesQuery: vi.fn(),
  useWithdrawTrackerManualEntryMutation: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/off-computer-time', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { OffComputerTimeForm: FormStub };
});

const FROM = '2026-03-01T00:00:00.000Z';
const TO = '2026-04-01T00:00:00.000Z';
const projects = [
  { id: 'p0', name: 'General' },
  { id: 'p1', name: 'Billing' },
];

function renderList(rows: unknown[] = entries) {
  vi.mocked(useMyTrackerManualEntriesQuery).mockReturnValue(
    queryResult({ data: { myTrackerManualEntries: rows } }),
  );
  vi.mocked(useWithdrawTrackerManualEntryMutation).mockReturnValue(mutationResult(vi.fn()));
  renderWithProviders(<MyOffComputerTime from={FROM} to={TO} projects={projects} />);
}

describe('MyOffComputerTime', () => {
  it("asks for this month's entries and refreshes them after a withdrawal", () => {
    renderList();
    expect(useMyTrackerManualEntriesQuery).toHaveBeenCalledWith({
      variables: { from: FROM, to: TO },
    });
    expect(useWithdrawTrackerManualEntryMutation).toHaveBeenCalledWith({
      refetchQueries: [MyTrackerManualEntriesDocument],
    });
  });

  it('lists each claim with its start, length, project, reason and review state', () => {
    renderList();
    const [, pending, rejected] = screen.getAllByRole('row');

    expect(within(pending).getByText('at 2026-03-05T10:00:00.000Z')).toBeInTheDocument();
    expect(within(pending).getByText('1h 30m')).toBeInTheDocument();
    expect(within(pending).getByText('Billing')).toBeInTheDocument();
    expect(within(pending).getByText('Client call')).toBeInTheDocument();
    expect(within(pending).getByText('Awaiting review')).toBeInTheDocument();

    expect(within(rejected).getByText('45m')).toBeInTheDocument();
    expect(within(rejected).getByText('—')).toBeInTheDocument();
    expect(within(rejected).getByText('Rejected')).toBeInTheDocument();
    expect(within(rejected).getByRole('button', { name: 'Withdraw entry' })).toBeInTheDocument();
  });

  it('says nothing is claimed when the month is empty', () => {
    renderList([]);
    expect(screen.getByText('No off-computer time claimed this month.')).toBeInTheDocument();
    expect(
      screen.getByText(/Every entry is reviewed before it counts towards your hours\./),
    ).toBeInTheDocument();
  });

  it('opens the claim form with the projects, and closes it from the header or when done', async () => {
    const user = userEvent.setup();
    renderList([]);
    expect(screen.queryByTestId('form-stub')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add time' }));
    expect(screen.getByTestId('form-stub')).toHaveAttribute('data-projects', 'General,Billing');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('form-stub')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add time' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));
    expect(screen.queryByTestId('form-stub')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add time' })).toBeInTheDocument();
  });

  it('holds the table busy and does not say nothing was claimed while the entries load', () => {
    vi.mocked(useMyTrackerManualEntriesQuery).mockReturnValue(queryResult({ loading: true }));
    vi.mocked(useWithdrawTrackerManualEntryMutation).mockReturnValue(mutationResult(vi.fn()));
    const { container } = renderWithProviders(
      <MyOffComputerTime from={FROM} to={TO} projects={projects} />,
    );

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No off-computer time claimed this month.')).toBeNull();
  });
});
