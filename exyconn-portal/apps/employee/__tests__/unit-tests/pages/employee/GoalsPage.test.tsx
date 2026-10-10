import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyGoalsQuery, useUpdateMyGoalProgressMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult } from './helpers/apollo';
import { GoalsPage } from '../../../../src/pages/employee/GoalsPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyGoalsQuery: vi.fn(),
  useUpdateMyGoalProgressMutation: vi.fn(),
}));

const goal = {
  kpi: '',
  weightage: 40,
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  managerComment: null,
};

const goals = [
  {
    ...goal,
    id: 'g1',
    title: 'Ship the billing revamp',
    kpi: 'Go-live',
    progress: 25,
    status: 'ACTIVE',
    managerComment: 'On track',
  },
  { ...goal, id: 'g2', title: 'Mentor two juniors', progress: 100, status: 'COMPLETED' },
  { ...goal, id: 'g3', title: 'Old OKR', progress: 50, status: 'CANCELLED' },
];

function renderGoals(update = vi.fn(() => Promise.resolve({}))) {
  const refetch = vi.fn(() => Promise.resolve({}));
  vi.mocked(useMyGoalsQuery).mockReturnValue(queryResult({ data: { myGoals: goals }, refetch }));
  vi.mocked(useUpdateMyGoalProgressMutation).mockReturnValue(mutationResult(update));
  renderWithProviders(<GoalsPage />);
  return { update, refetch };
}

describe('GoalsPage', () => {
  it('shows each goal with its KPI, weight, window, progress and the manager comment', () => {
    renderGoals();
    const [, active, completed] = screen.getAllByRole('row');

    expect(within(active).getByText('Ship the billing revamp')).toBeInTheDocument();
    expect(within(active).getByText('Go-live')).toBeInTheDocument();
    expect(within(active).getByText('40%')).toBeInTheDocument();
    expect(within(active).getByText('on 2026-01-01 → on 2026-03-31')).toBeInTheDocument();
    expect(within(active).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(within(active).getByText('On track')).toBeInTheDocument();
    expect(within(active).getByText('ACTIVE')).toBeInTheDocument();

    // No KPI and no comment yet: a dash in each.
    expect(within(completed).getAllByText('—')).toHaveLength(2);
  });

  it('locks the picker on completed and cancelled goals only', () => {
    renderGoals();
    const [active, completed, cancelled] = screen.getAllByRole('combobox');
    expect(active).not.toHaveAttribute('aria-disabled');
    expect(completed).toHaveAttribute('aria-disabled', 'true');
    expect(cancelled).toHaveAttribute('aria-disabled', 'true');
  });

  it('saves a new progress step, confirms it and reloads the goals', async () => {
    const user = userEvent.setup();
    const { update, refetch } = renderGoals();

    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: '75%' }));

    expect(update).toHaveBeenCalledWith({ variables: { id: 'g1', progress: 75 } });
    expect(await screen.findByText('Progress updated.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says no goals are set when the list is empty', () => {
    vi.mocked(useMyGoalsQuery).mockReturnValue(queryResult({ data: { myGoals: [] } }));
    vi.mocked(useUpdateMyGoalProgressMutation).mockReturnValue(mutationResult(vi.fn()));
    renderWithProviders(<GoalsPage />);
    expect(screen.getByText('No goals have been set for you yet.')).toBeInTheDocument();
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyGoalsQuery).mockReturnValue(queryResult({ loading: true }));
    vi.mocked(useUpdateMyGoalProgressMutation).mockReturnValue(mutationResult(vi.fn()));
    const { container } = renderWithProviders(<GoalsPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No goals have been set for you yet.')).toBeNull();
  });
});
