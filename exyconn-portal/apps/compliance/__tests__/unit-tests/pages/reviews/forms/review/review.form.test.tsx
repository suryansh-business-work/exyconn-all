import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagementReviewStatus } from '@exyconn/shell/graphql/generated';
import { ReviewForm } from '../../../../../../src/pages/reviews/forms/review';
import { reviewRow } from '../../../compliance.fixtures';
import { fill, pickOption, submitForm } from '../../../form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateManagementReviewMutation: () => [gql.create],
  useUpdateManagementReviewMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ReturnType<typeof reviewRow> | null = null) =>
  renderWithProviders(<ReviewForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const actionInputs = () => screen.queryAllByLabelText('Action');

describe('ReviewForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a name and at least one standard', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name the review')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one standard')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('records a new review with the actions it decided', async () => {
    renderForm();
    expect(actionInputs()).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Add action' }));
    fill('Action', 'Book the surveillance audit');
    fill('Review', 'Q4 management review');
    await pickOption(/Standards/, 'ISO 14001');
    submitForm();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Q4 management review',
          standards: ['ISO_14001'],
          status: ManagementReviewStatus.Planned,
          actions: [
            { description: 'Book the surveillance audit', ownerName: '', dueOn: null, done: false },
          ],
        }),
      },
    });
    expect(await screen.findByText('Management review created')).toBeInTheDocument();
  });

  it('will not save an action that does not say what it is', async () => {
    renderForm(reviewRow());
    await userEvent.click(screen.getByRole('button', { name: 'Add action' }));
    expect(actionInputs()).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Say what the action is')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('drops a removed action from the minute it updates', async () => {
    renderForm(reviewRow());
    const [first, second] = actionInputs();
    expect(first).toHaveValue('Hire a second auditor');
    expect(second).toHaveValue('Refresh the policy');
    await userEvent.click(screen.getByRole('button', { name: 'Remove action 1' }));
    expect(actionInputs()).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'review-1',
        input: expect.objectContaining({
          heldOn: '2026-09-30T00:00:00.000Z',
          actions: [{ description: 'Refresh the policy', ownerName: '', dueOn: null, done: true }],
        }),
      },
    });
  });

  it('will not minute a review that says nothing about what was decided', async () => {
    renderForm(reviewRow({ status: ManagementReviewStatus.Minuted, decisions: '' }));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText(
        'A minuted review has to say what was considered and what was decided',
      ),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
