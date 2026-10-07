import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ReviewStatus,
  useSubmitManagerAssessmentMutation,
  useTeamPerformanceReviewsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../apolloHookMocks';
import { TeamReviewsSection } from '../../../../../src/pages/employee/team/TeamReviewsSection';
import { nameOf, reviewRow } from './teamFixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTeamPerformanceReviewsQuery: vi.fn(),
  useSubmitManagerAssessmentMutation: vi.fn(),
}));

const ASSESSMENT = 'Delivered the billing rewrite and mentored two juniors.';
const submitAssessment = vi.fn();

function setup(result: Parameters<typeof queryResult>[0]) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useTeamPerformanceReviewsQuery).mockReturnValue(
    queryResult<typeof useTeamPerformanceReviewsQuery>({ refetch, ...result }),
  );
  renderWithProviders(<TeamReviewsSection nameOf={nameOf} />);
  return { refetch };
}

const ROWS = [
  reviewRow(),
  reviewRow({
    id: 'review-2',
    employeeId: 'emp-2',
    managerAssessment: 'Strong half; owns the release train.',
    score: 8,
    status: ReviewStatus.ManagerSubmitted,
  }),
  reviewRow({ id: 'review-3', employeeId: 'emp-gone', score: 0, status: ReviewStatus.Open }),
  reviewRow({ id: 'review-4', cycle: '2025 H2', score: undefined, status: ReviewStatus.Closed }),
];

async function openAssessment() {
  await userEvent.click(screen.getByRole('button', { name: 'Write assessment' }));
  return screen.findByRole('dialog');
}

beforeEach(() => {
  submitAssessment.mockReset();
  vi.mocked(useSubmitManagerAssessmentMutation).mockReturnValue(
    mutationTuple<typeof useSubmitManagerAssessmentMutation>(submitAssessment),
  );
});

describe('TeamReviewsSection', () => {
  it('says the reviews are loading before any arrive', () => {
    setup({ loading: true });
    expect(useTeamPerformanceReviewsQuery).toHaveBeenCalledWith({
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says so when no appraisal cycle is open', () => {
    setup({ data: { teamPerformanceReviews: [] } });
    expect(screen.getByText('No appraisal cycles are open for your team.')).toBeInTheDocument();
  });

  it('shows each appraisal with its cycle, the manager’s half, score and status', () => {
    setup({ data: { teamPerformanceReviews: ROWS } });

    expect(screen.getByText('Performance reviews')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao · 2026 H1')).toBeInTheDocument();
    expect(screen.getAllByText('No manager assessment yet.')).toHaveLength(3);
    expect(screen.getByText('SELF SUBMITTED')).toBeInTheDocument();
    expect(screen.getByText('Vikram Shah · 2026 H1')).toBeInTheDocument();
    expect(screen.getByText('Strong half; owns the release train.')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    // A zero is still a score; a missing one is not shown at all.
    expect(screen.getByText('emp-gone · 2026 H1')).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao · 2025 H2')).toBeInTheDocument();
    expect(screen.getAllByText(/\/10$/)).toHaveLength(2);
  });

  it('lets the manager write only where the employee has submitted', () => {
    setup({ data: { teamPerformanceReviews: ROWS } });
    expect(screen.getAllByRole('button', { name: 'Write assessment' })).toHaveLength(1);
  });

  it('opens the assessment for the right person and cycle, and cancels', async () => {
    setup({ data: { teamPerformanceReviews: ROWS } });
    const dialog = await openAssessment();

    expect(
      within(dialog).getByRole('heading', { name: 'Assess Asha Rao · 2026 H1' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Shipped billing.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it('closes the assessment from its close button', async () => {
    setup({ data: { teamPerformanceReviews: ROWS } });
    const dialog = await openAssessment();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('submits the assessment, closes and refreshes the reviews', async () => {
    submitAssessment.mockResolvedValue({ data: { submitManagerAssessment: { id: 'review-1' } } });
    const { refetch } = setup({ data: { teamPerformanceReviews: ROWS } });
    const dialog = await openAssessment();

    await userEvent.type(within(dialog).getByLabelText('Your assessment'), ASSESSMENT);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit assessment' }));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(submitAssessment).toHaveBeenCalledWith({
      variables: { id: 'review-1', managerAssessment: ASSESSMENT, score: null },
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
