import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { GoalProgressControl } from '../../../../src/pages/employee/GoalProgressControl';

describe('GoalProgressControl', () => {
  it('offers the quarter steps and reports the one picked as a number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<GoalProgressControl progress={25} disabled={false} onChange={onChange} />);

    const picker = screen.getByRole('combobox');
    expect(picker).toHaveTextContent('25%');
    await user.click(picker);

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      '0%',
      '25%',
      '50%',
      '75%',
      '100%',
    ]);
    await user.click(screen.getByRole('option', { name: '75%' }));
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('cannot be changed while disabled', () => {
    renderWithProviders(<GoalProgressControl progress={100} disabled onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
  });
});
