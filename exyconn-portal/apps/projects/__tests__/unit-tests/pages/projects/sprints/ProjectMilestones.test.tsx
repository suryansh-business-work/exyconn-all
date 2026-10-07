import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MilestoneState } from '@exyconn/shell/graphql/generated';
import { ProjectMilestones } from '../../../../../src/pages/projects/sprints';
import { renderWithProviders } from '../../../test-utils';
import { milestoneRow } from '../../../fixtures';

const gql = vi.hoisted(() => ({ milestones: vi.fn(), refetch: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectMilestonesQuery: (options: unknown) => gql.milestones(options),
  useDeleteMilestoneMutation: () => [gql.remove],
}));

vi.mock('../../../../../src/pages/projects/forms/milestone', async () => ({
  MilestoneForm: (await import('../../../helpers/form-stub')).FormStub,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `due ${value.slice(0, 10)}` }),
}));

const answer = (rows: unknown[] | undefined, loading = false) =>
  gql.milestones.mockReturnValue({
    data: rows ? { projectMilestones: rows } : undefined,
    loading,
    refetch: gql.refetch,
  });

async function confirmDelete(name: string, answerWith: string) {
  await userEvent.click(screen.getByRole('button', { name: `Delete ${name}` }));
  expect(await screen.findByText(`Delete milestone "${name}"?`)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answerWith }));
}

describe('ProjectMilestones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteMilestone: true } });
    answer([milestoneRow()]);
  });

  it('lists each milestone with its state, name and due date', () => {
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    expect(screen.getByText('Milestones (1)')).toBeInTheDocument();
    expect(screen.getByText('Go live')).toBeInTheDocument();
    expect(screen.getByText('due 2026-11-01')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorInfo',
    );
    expect(gql.milestones).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('colours a missed milestone red, a hit one green, and says when there is no date', () => {
    answer([
      milestoneRow({ id: 'm1', name: 'Beta', state: MilestoneState.Missed }),
      milestoneRow({ id: 'm2', name: 'Alpha', state: MilestoneState.Hit }),
      milestoneRow({ id: 'm3', name: 'Later', state: MilestoneState.Planned, dueOn: null }),
    ]);
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    expect(screen.getByText('MISSED').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    expect(screen.getByText('HIT').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    expect(screen.getByText('PLANNED').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorDefault',
    );
    expect(screen.getByText('No date')).toBeInTheDocument();
  });

  it('shows a spinner on the first load and skips the query without a project', () => {
    answer(undefined, true);
    renderWithProviders(<ProjectMilestones projectId="" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/No milestones yet/)).not.toBeInTheDocument();
    expect(gql.milestones).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('explains what milestones are for when there are none', () => {
    answer([]);
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    expect(
      screen.getByText('No milestones yet. Anything set here is what a shared client link shows.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('opens a blank form for a new milestone and reloads after it is saved', async () => {
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    expect(screen.getByRole('heading', { name: 'New milestone' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Milestones (1)')).toBeInTheDocument();
  });

  it('keeps the list as it was when the reload after a save fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(await screen.findByText('Go live')).toBeInTheDocument();
  });

  it('edits a milestone with its own values, and returns via cancel or back', async () => {
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Go live' }));
    expect(screen.getByRole('heading', { name: 'Edit milestone' })).toBeInTheDocument();
    expect(screen.getByText(/"name":"Go live"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.getByText('Milestones (1)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Go live' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Milestones (1)')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('deletes a milestone after confirming, then reloads', async () => {
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    await confirmDelete('Go live', 'Delete');

    await waitFor(() =>
      expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'milestone-1' } }),
    );
    expect(await screen.findByText('Milestone deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes nothing when the person cancels', async () => {
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);

    await confirmDelete('Go live', 'Cancel');

    await waitFor(() =>
      expect(screen.queryByText('Delete milestone "Go live"?')).not.toBeInTheDocument(),
    );
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('says why a delete failed, with a fallback for a non-Error', async () => {
    gql.remove.mockRejectedValueOnce(new Error('Milestone is locked'));
    const { unmount } = renderWithProviders(<ProjectMilestones projectId="proj-1" />);
    await confirmDelete('Go live', 'Delete');
    expect(await screen.findByText('Milestone is locked')).toBeInTheDocument();
    unmount();

    gql.remove.mockRejectedValueOnce('offline');
    renderWithProviders(<ProjectMilestones projectId="proj-1" />);
    await confirmDelete('Go live', 'Delete');
    expect(await screen.findByText('Could not delete the milestone')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
