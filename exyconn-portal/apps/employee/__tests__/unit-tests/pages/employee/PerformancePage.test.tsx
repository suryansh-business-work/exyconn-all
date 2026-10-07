import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMyPerformanceReviewsQuery,
  useSubmitSelfAssessmentMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult, queryResult } from './helpers/apollo';
import { PerformancePage } from '../../../../src/pages/employee/PerformancePage';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyPerformanceReviewsQuery: vi.fn(),
  useSubmitSelfAssessmentMutation: vi.fn(),
}));

const review = {
  selfAssessment: '',
  managerAssessment: '',
  competencies: '',
  score: null,
  rating: null,
  actionPlan: '',
};

const reviews = [
  { ...review, id: 'r2', cycle: 'H1 2026', status: 'OPEN' },
  { ...review, id: 'r1', cycle: 'H2 2025', status: 'CLOSED', selfAssessment: 'Done' },
];

describe('PerformancePage', () => {
  it('says it is loading before the first answer', () => {
    vi.mocked(useMyPerformanceReviewsQuery).mockReturnValue(queryResult({ loading: true }));
    vi.mocked(useSubmitSelfAssessmentMutation).mockReturnValue(mutationResult(vi.fn()));
    renderWithProviders(<PerformancePage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says no cycle is open when there are none', () => {
    vi.mocked(useMyPerformanceReviewsQuery).mockReturnValue(
      queryResult({ data: { myPerformanceReviews: [] } }),
    );
    vi.mocked(useSubmitSelfAssessmentMutation).mockReturnValue(mutationResult(vi.fn()));
    renderWithProviders(<PerformancePage />);
    expect(screen.getByText('No appraisal cycle has been opened for you yet.')).toBeInTheDocument();
  });

  it('shows one card per cycle in the order given', () => {
    vi.mocked(useMyPerformanceReviewsQuery).mockReturnValue(
      queryResult({ data: { myPerformanceReviews: reviews } }),
    );
    vi.mocked(useSubmitSelfAssessmentMutation).mockReturnValue(mutationResult(vi.fn()));
    renderWithProviders(<PerformancePage />);

    const cycles = screen.getAllByRole('heading', { level: 6 }).map((h) => h.textContent);
    expect(cycles).toEqual(['H1 2026', 'H2 2025']);
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('submits the self-assessment, confirms it and reloads the cycles', async () => {
    const user = userEvent.setup();
    const submit = vi.fn(() => Promise.resolve({}));
    const refetch = vi.fn(() => Promise.resolve({}));
    vi.mocked(useMyPerformanceReviewsQuery).mockReturnValue(
      queryResult({ data: { myPerformanceReviews: reviews }, refetch }),
    );
    vi.mocked(useSubmitSelfAssessmentMutation).mockReturnValue(mutationResult(submit));
    renderWithProviders(<PerformancePage />);

    await user.type(
      screen.getByRole('textbox', { name: 'Your self-assessment' }),
      'Shipped billing',
    );
    await user.click(screen.getByRole('button', { name: 'Submit self-assessment' }));

    expect(submit).toHaveBeenCalledWith({ variables: { id: 'r2', text: 'Shipped billing' } });
    expect(await screen.findByText('Self-assessment submitted.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
