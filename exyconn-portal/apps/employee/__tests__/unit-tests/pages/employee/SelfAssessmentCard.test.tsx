import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import {
  SelfAssessmentCard,
  type ReviewRow,
} from '../../../../src/pages/employee/SelfAssessmentCard';

const review: ReviewRow = {
  id: 'r1',
  cycle: 'H1 2026',
  selfAssessment: '',
  managerAssessment: '',
  competencies: '',
  score: null,
  rating: null,
  actionPlan: '',
  status: 'OPEN',
};

describe('SelfAssessmentCard', () => {
  it('lets the employee write and submit their assessment while the cycle is open', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(<SelfAssessmentCard review={review} onSubmit={onSubmit} />);

    expect(screen.getByRole('heading', { name: 'H1 2026' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submit self-assessment' });
    expect(submit).toBeDisabled();

    const box = screen.getByRole('textbox', { name: 'Your self-assessment' });
    await user.type(box, '   ');
    expect(submit).toBeDisabled();
    await user.clear(box);
    await user.type(box, 'Shipped billing');
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith('r1', 'Shipped billing');
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Submit self-assessment' })).toBeEnabled();
  });

  it('starts from what the employee already wrote', () => {
    renderWithProviders(
      <SelfAssessmentCard
        review={{ ...review, selfAssessment: 'Draft notes' }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Your self-assessment' })).toHaveValue(
      'Draft notes',
    );
    expect(screen.getByText('Not shared yet.')).toBeInTheDocument();
  });

  it('shows a closed cycle read-only, with the score, rating, manager view and action plan', () => {
    renderWithProviders(
      <SelfAssessmentCard
        review={{
          ...review,
          status: 'CLOSED',
          selfAssessment: 'Led the migration',
          managerAssessment: 'Strong delivery',
          score: 8,
          rating: 'EXCEEDS',
          actionPlan: 'Own a squad',
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('EXCEEDS')).toBeInTheDocument();
    expect(screen.getByText('Score: 8/10')).toBeInTheDocument();
    expect(screen.getByText('Led the migration')).toBeInTheDocument();
    expect(screen.getByText('Strong delivery')).toBeInTheDocument();
    expect(screen.getByText('Action plan')).toBeInTheDocument();
    expect(screen.getByText('Own a squad')).toBeInTheDocument();
  });

  it('leaves out what a closed cycle never recorded', () => {
    renderWithProviders(
      <SelfAssessmentCard
        review={{ ...review, status: 'CLOSED', score: undefined }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Not shared yet.')).toBeInTheDocument();
    expect(screen.queryByText(/^Score:/)).toBeNull();
    expect(screen.queryByText('Action plan')).toBeNull();
  });

  it('shows a score of zero rather than hiding it', () => {
    renderWithProviders(
      <SelfAssessmentCard review={{ ...review, status: 'CLOSED', score: 0 }} onSubmit={vi.fn()} />,
    );
    expect(screen.getByText('Score: 0/10')).toBeInTheDocument();
  });
});
