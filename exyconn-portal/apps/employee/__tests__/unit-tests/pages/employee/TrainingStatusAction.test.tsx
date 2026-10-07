import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingStatus } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { TrainingStatusAction } from '../../../../src/pages/employee/TrainingStatusAction';

describe('TrainingStatusAction', () => {
  it('starts an assigned course', async () => {
    const onAdvance = vi.fn();
    renderWithProviders(
      <TrainingStatusAction status={TrainingStatus.Assigned} onAdvance={onAdvance} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onAdvance).toHaveBeenCalledWith(TrainingStatus.InProgress);
  });

  it('completes a course in progress', async () => {
    const onAdvance = vi.fn();
    renderWithProviders(
      <TrainingStatusAction status={TrainingStatus.InProgress} onAdvance={onAdvance} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(onAdvance).toHaveBeenCalledWith(TrainingStatus.Completed);
  });

  it('offers nothing more on a completed course', () => {
    renderWithProviders(
      <TrainingStatusAction status={TrainingStatus.Completed} onAdvance={vi.fn()} />,
    );
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
