import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewStatus } from '@exyconn/shell/graphql/generated';
import {
  PerformanceReviewForm,
  type PerformanceReviewRow,
} from '../../../../../../src/pages/performance/forms/performance-review';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreatePerformanceReviewMutation: () => [gql.create],
  useUpdatePerformanceReviewMutation: () => [gql.update],
  useListUsersQuery: () => ({ data: gql.users }),
}));

const USERS = { listUsers: [{ id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' }] };

const ROW: PerformanceReviewRow = {
  id: 'review-3',
  employeeId: 'user-1',
  cycle: 'FY26 H1',
  selfAssessment: 'Shipped the tracker',
  managerAssessment: 'Strong half',
  competencies: 'Ownership',
  score: 8,
  rating: 'Exceeds',
  actionPlan: 'Lead the next release',
  status: ReviewStatus.SelfSubmitted,
  updatedAt: '2026-03-04T12:00:00.000Z',
};

function renderForm(initial: PerformanceReviewRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PerformanceReviewForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

async function fillNewReview() {
  const user = userEvent.setup();
  await user.type(screen.getByRole('combobox', { name: 'Employee' }), 'Asha');
  await user.click(await screen.findByRole('option', { name: 'Asha Rao (asha@example.com)' }));
  await user.type(screen.getByLabelText('Cycle'), ' FY26 H2 ');
  await user.type(screen.getByLabelText('Self assessment'), 'Did well');
  await user.type(screen.getByLabelText('Manager assessment'), 'Agreed');
  await user.type(screen.getByLabelText('Competencies'), 'Craft');
  await user.type(screen.getByLabelText('Action plan'), 'Mentor two people');
}

describe('PerformanceReviewForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: { createPerformanceReview: { id: 'r9' } } });
    gql.update.mockReset().mockResolvedValue({ data: { updatePerformanceReview: { id: 'r3' } } });
    gql.users = USERS;
  });

  it('creates a review with no score or rating sent as not set', async () => {
    const { onDone } = renderForm();

    await fillNewReview();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'user-1',
          cycle: 'FY26 H2',
          selfAssessment: 'Did well',
          managerAssessment: 'Agreed',
          competencies: 'Craft',
          score: null,
          rating: null,
          actionPlan: 'Mentor two people',
          status: ReviewStatus.Closed,
        },
      },
    });
    expect(await screen.findByText('PerformanceReview created')).toBeInTheDocument();
  });

  it('opens an existing review and updates it with a new score, rating and status', async () => {
    const { onDone } = renderForm(ROW);

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Asha Rao (asha@example.com)',
    );
    await userEvent.clear(screen.getByLabelText('Score (0-10)'));
    await userEvent.type(screen.getByLabelText('Score (0-10)'), '9');
    await userEvent.clear(screen.getByLabelText('Rating'));
    await userEvent.type(screen.getByLabelText('Rating'), 'Outstanding');
    await userEvent.click(screen.getByRole('combobox', { name: /Status/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Manager Submitted' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'review-3',
        input: expect.objectContaining({
          score: 9,
          rating: 'Outstanding',
          status: ReviewStatus.ManagerSubmitted,
        }),
      },
    });
    expect(await screen.findByText('PerformanceReview updated')).toBeInTheDocument();
  });

  it('keeps a stored score and rating when nothing is changed', async () => {
    renderForm(ROW);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      score: 8,
      rating: 'Exceeds',
    });
  });

  it('says which required fields are missing before anything is sent', async () => {
    gql.users = undefined;
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Cycle is required')).toBeInTheDocument();
    expect(screen.getByText('Self assessment is required')).toBeInTheDocument();
    expect(screen.getByText('Manager assessment is required')).toBeInTheDocument();
    expect(screen.getByText('Competencies is required')).toBeInTheDocument();
    expect(screen.getByText('Action plan is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative score', async () => {
    renderForm(ROW);

    await userEvent.clear(screen.getByLabelText('Score (0-10)'));
    await userEvent.paste('-1');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it("reports the server's reason and does not close", async () => {
    gql.update.mockRejectedValue(new Error('Review is closed'));
    const { onDone } = renderForm(ROW);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Review is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
