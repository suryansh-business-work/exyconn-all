import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SubmissionTriageForm,
  type WebsiteSubmissionRow,
} from '../../../../../../src/pages/website/forms/submission-triage';
import { renderWithProviders } from '../../../../test-utils';
import { field, pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ triage: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTriageWebsiteSubmissionMutation: () => [gql.triage],
}));

const submission: WebsiteSubmissionRow = {
  id: 'sub-1',
  formType: 'contact',
  source: 'website',
  submissionData: { message: 'Hello' },
  status: 'new',
  notes: '',
  leadId: null,
  applicantId: null,
  createdAt: '2026-03-01T00:00:00.000Z',
};

function setup(row: WebsiteSubmissionRow = submission) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <SubmissionTriageForm submission={row} onDone={onDone} onCancel={onCancel} />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

const save = () => screen.getByRole('button', { name: 'Save triage' });

describe('SubmissionTriageForm', () => {
  beforeEach(() => {
    gql.triage.mockReset();
  });

  it('records the new status and internal notes', async () => {
    gql.triage.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    await pickOption(user, 'Status', 'resolved');
    await user.type(field('Notes'), '  Called back  ');
    await user.click(save());

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.triage).toHaveBeenCalledWith({
      variables: { id: 'sub-1', input: { status: 'resolved', notes: 'Called back' } },
    });
    expect(await screen.findByText('Submission triaged')).toBeInTheDocument();
  });

  it('needs a status', async () => {
    const { user } = setup({ ...submission, status: '' });

    await user.click(save());

    expect(await screen.findByText('Status is required')).toBeInTheDocument();
    expect(gql.triage).not.toHaveBeenCalled();
  });

  it("shows the server's message when the triage is refused", async () => {
    gql.triage.mockRejectedValue(new Error('Submission was deleted'));
    const { user, onDone } = setup();

    await user.click(save());

    expect(await screen.findByText('Submission was deleted')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    gql.triage.mockRejectedValue('offline');
    const { user, onDone } = setup();

    await user.click(save());

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels', async () => {
    const { user, onCancel } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
