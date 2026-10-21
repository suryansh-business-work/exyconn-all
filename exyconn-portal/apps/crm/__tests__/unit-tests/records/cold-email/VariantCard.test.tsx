import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantCard } from '../../../../src/records/cold-email';
import { renderWithProviders } from '../../test-utils';
import { variant } from './cold-email-fixtures';

const handlers = () => ({ onEdit: vi.fn(), onDelete: vi.fn(), onUse: vi.fn() });

describe('VariantCard', () => {
  it('shows a version with its number, tone, cost and what was asked of the AI', () => {
    renderWithProviders(
      <VariantCard
        variant={variant('v1', { instruction: 'shorter' })}
        number={3}
        busy={false}
        {...handlers()}
      />,
    );
    expect(screen.getByRole('article', { name: 'Subject v1' })).toBeInTheDocument();
    expect(screen.getByText('Version 3')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
    expect(screen.getByText(/· asked: shorter$/)).toBeInTheDocument();
  });

  it('leaves out the ask when there was none', () => {
    renderWithProviders(
      <VariantCard variant={variant('v1')} number={1} busy={false} {...handlers()} />,
    );
    expect(screen.getByText(/^Written .* · cost /)).not.toHaveTextContent('asked');
  });

  it('opens the whole message and folds it again', async () => {
    renderWithProviders(
      <VariantCard variant={variant('v1')} number={1} busy={false} {...handlers()} />,
    );
    const toggle = screen.getByRole('button', { name: 'Show all' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument();
  });

  it('hands each action to its caller, and holds Delete while one is running', async () => {
    const actions = handlers();
    const { rerender } = renderWithProviders(
      <VariantCard variant={variant('v1')} number={1} busy={false} {...actions} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Use this' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(actions.onUse).toHaveBeenCalledTimes(1);
    expect(actions.onEdit).toHaveBeenCalledTimes(1);
    expect(actions.onDelete).toHaveBeenCalledTimes(1);

    rerender(<VariantCard variant={variant('v1')} number={1} busy {...actions} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
  });
});
