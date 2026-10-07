import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabSearch } from '@/components/layout/TabSearch';
import { renderWithProviders } from '../../test-utils';

function renderSearch(open: boolean, query = '') {
  const handlers = { onOpen: vi.fn(), onClose: vi.fn(), onQueryChange: vi.fn(), onSubmit: vi.fn() };
  renderWithProviders(<TabSearch open={open} query={query} controls="hr-tabs" {...handlers} />);
  return handlers;
}

describe('TabSearch', () => {
  it('is a collapsed icon that opens the search', async () => {
    const { onOpen } = renderSearch(false);

    const button = screen.getByRole('button', { name: 'Search tabs' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'hr-tabs');

    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens focused on the box and reports what is typed', () => {
    const { onQueryChange } = renderSearch(true, 'pay');

    const box = screen.getByRole('textbox', { name: 'Search tabs' });
    expect(box).toHaveFocus();
    expect(box).toHaveValue('pay');
    expect(box).toHaveAttribute('aria-controls', 'hr-tabs');

    fireEvent.change(box, { target: { value: 'payroll' } });
    expect(onQueryChange).toHaveBeenCalledWith('payroll');
  });

  it('goes to the first match on Enter and closes on Escape or the cross', async () => {
    const { onSubmit, onClose } = renderSearch(true, 'pay');
    const box = screen.getByRole('textbox', { name: 'Search tabs' });

    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(box, { key: 'a' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(box, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Close tab search' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
