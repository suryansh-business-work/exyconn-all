import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketComments } from '../../../../../src/pages/projects/ticket/TicketComments';
import { renderWithProviders } from '../../../test-utils';
import { commentFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({ comments: vi.fn(), refetch: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTaskCommentsQuery: () => gql.comments(),
  useAddTaskCommentMutation: () => [vi.fn(), { loading: false }],
  useDeleteTaskCommentMutation: () => [gql.remove],
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => value }),
}));

describe('TicketComments deleting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({});
    gql.comments.mockReturnValue({
      data: { taskComments: [commentFixture({ id: 'comment-7' })] },
      refetch: gql.refetch,
    });
  });

  it('deletes a comment after confirming, then reloads', async () => {
    renderWithProviders(<TicketComments taskId="task-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete comment by Asha Rao' }));
    expect(await screen.findByText('Delete this comment?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'comment-7' } }),
    );
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });

  it('keeps a comment the person decided not to delete', async () => {
    renderWithProviders(<TicketComments taskId="task-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete comment by Asha Rao' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Delete this comment?')).not.toBeInTheDocument());
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('reports a failed delete with a generic message for a non-Error', async () => {
    gql.remove.mockRejectedValueOnce('offline');
    renderWithProviders(<TicketComments taskId="task-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete comment by Asha Rao' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Action failed')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
