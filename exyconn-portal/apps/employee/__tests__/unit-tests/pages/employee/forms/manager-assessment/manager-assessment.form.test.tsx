import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewStatus, useSubmitManagerAssessmentMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple } from '../../apolloHookMocks';
import {
  ManagerAssessmentForm,
  type TeamReviewRow,
} from '../../../../../../src/pages/employee/forms/manager-assessment';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSubmitManagerAssessmentMutation: vi.fn(),
}));

const ASSESSMENT = 'Delivered the billing rewrite and mentored two juniors.';

const review = (patch: Partial<TeamReviewRow> = {}): TeamReviewRow => ({
  id: 'review-1',
  employeeId: 'emp-1',
  cycle: '2026 H1',
  selfAssessment: 'Shipped billing.\nLed onboarding.',
  managerAssessment: '',
  score: null,
  status: ReviewStatus.SelfSubmitted,
  updatedAt: '2026-06-30T00:00:00.000Z',
  ...patch,
});

const submitAssessment = vi.fn();

function setup(patch: Partial<TeamReviewRow> = {}) {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(
    <ManagerAssessmentForm review={review(patch)} onCancel={onCancel} onDone={onDone} />,
  );
  return { onCancel, onDone };
}

const assessment = () => screen.getByLabelText('Your assessment');
const score = () => screen.getByLabelText('Score (optional)');
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Submit assessment' }));

beforeEach(() => {
  submitAssessment.mockReset();
  vi.mocked(useSubmitManagerAssessmentMutation).mockReturnValue(
    mutationTuple<typeof useSubmitManagerAssessmentMutation>(submitAssessment),
  );
});

describe('ManagerAssessmentForm', () => {
  it('shows the employee’s self-assessment and starts from the saved half', () => {
    setup({ managerAssessment: ASSESSMENT, score: 8 });
    expect(screen.getByText('Their self-assessment')).toBeInTheDocument();
    expect(screen.getByText(/Shipped billing\./)).toBeInTheDocument();
    expect(assessment()).toHaveValue(ASSESSMENT);
    expect(score()).toHaveValue(8);
    expect(screen.getByText('Between 0 and 10.')).toBeInTheDocument();
  });

  it('shows a dash when the employee wrote nothing, and an empty score', () => {
    setup({ selfAssessment: '' });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(score()).toHaveValue(null);
  });

  it('asks for at least a few sentences', async () => {
    setup();
    await userEvent.type(assessment(), 'Good work.');
    await submit();

    expect(
      await screen.findByText('Write at least a few sentences (20+ characters)'),
    ).toBeInTheDocument();
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it.each(['11', '-1'])('keeps a score of %s inside 0 to 10', async (value) => {
    setup({ managerAssessment: ASSESSMENT });
    fireEvent.change(score(), { target: { value } });
    await submit();

    expect(await screen.findByText('Score must be between 0 and 10')).toBeInTheDocument();
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it('refuses a fractional score', async () => {
    setup({ managerAssessment: ASSESSMENT });
    fireEvent.change(score(), { target: { value: '7.5' } });
    await submit();

    await waitFor(() => expect(score()).toHaveAttribute('aria-invalid', 'true'));
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it('submits the assessment with the score as a number', async () => {
    submitAssessment.mockResolvedValue({ data: { submitManagerAssessment: { id: 'review-1' } } });
    const { onDone } = setup();
    await userEvent.type(assessment(), ASSESSMENT);
    fireEvent.change(score(), { target: { value: '7' } });
    await submit();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(submitAssessment).toHaveBeenCalledWith({
      variables: { id: 'review-1', managerAssessment: ASSESSMENT, score: 7 },
    });
    expect(await screen.findByText('Assessment submitted')).toBeInTheDocument();
  });

  it('sends no score when the manager leaves it empty', async () => {
    submitAssessment.mockResolvedValue({ data: { submitManagerAssessment: { id: 'review-1' } } });
    setup({ managerAssessment: ASSESSMENT });
    await submit();

    await waitFor(() => expect(submitAssessment).toHaveBeenCalledTimes(1));
    expect(submitAssessment).toHaveBeenCalledWith({
      variables: { id: 'review-1', managerAssessment: ASSESSMENT, score: null },
    });
  });

  it('shows the server’s message when submitting fails', async () => {
    submitAssessment.mockRejectedValue(new Error('The cycle is closed'));
    const { onDone } = setup({ managerAssessment: ASSESSMENT });
    await submit();

    expect(await screen.findByText('The cycle is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    submitAssessment.mockRejectedValue(null);
    setup({ managerAssessment: ASSESSMENT });
    await submit();

    expect(await screen.findByText('Could not submit the assessment')).toBeInTheDocument();
  });

  it('cancels without submitting', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
