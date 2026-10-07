import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SprintState } from '@exyconn/shell/graphql/generated';
import { SprintCard, type SprintProgress } from '../../../../../src/pages/projects/sprints';
import { renderWithProviders } from '../../../test-utils';
import { sprintRow } from '../../../fixtures';

const PROGRESS: SprintProgress = {
  committedPoints: 10,
  completedPoints: 5,
  ticketCount: 4,
  completedTickets: 2,
  percentComplete: 50,
};

function renderCard(state: SprintState, goal = 'Ship sign-in') {
  const handlers = { onStart: vi.fn(), onComplete: vi.fn(), onDelete: vi.fn() };
  const sprint = sprintRow({ state, goal });
  renderWithProviders(
    <SprintCard sprint={sprint} progress={PROGRESS} window="1 Oct → 14 Oct" {...handlers} />,
  );
  return { sprint, ...handlers };
}

describe('SprintCard', () => {
  it('shows the window, goal and committed against completed points', () => {
    renderCard(SprintState.Planned);

    expect(screen.getByText('Sprint 12')).toBeInTheDocument();
    expect(screen.getByText('1 Oct → 14 Oct · Ship sign-in')).toBeInTheDocument();
    expect(screen.getByText('5/10 pts · 2/4 tickets')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Sprint 12 progress' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });

  it('leaves the goal out when the sprint has none', () => {
    renderCard(SprintState.Planned, '');

    expect(screen.getByText('1 Oct → 14 Oct')).toBeInTheDocument();
  });

  it('offers only Start on a planned sprint', async () => {
    const { sprint, onStart } = renderCard(SprintState.Planned);

    expect(screen.getByText(SprintState.Planned).closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorDefault',
    );
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onStart).toHaveBeenCalledWith(sprint);
  });

  it('offers only Complete on a running sprint', async () => {
    const { sprint, onComplete } = renderCard(SprintState.Active);

    expect(screen.getByText(SprintState.Active).closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorPrimary',
    );
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Complete' }));
    expect(onComplete).toHaveBeenCalledWith(sprint);
  });

  it('offers no lifecycle action on a finished sprint, but it can still be deleted', async () => {
    const { sprint, onDelete } = renderCard(SprintState.Completed);

    expect(screen.getByText(SprintState.Completed).closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorSuccess',
    );
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete sprint Sprint 12' }));
    expect(onDelete).toHaveBeenCalledWith(sprint);
  });
});
