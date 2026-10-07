import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarToolbar } from '../../../../../src/pages/social/CalendarTab/CalendarToolbar';
import { renderWithProviders } from '../../../test-utils';

const SEPTEMBER = new Date(2026, 8, 1);

describe('CalendarToolbar', () => {
  it("names the month in the reader's language", () => {
    renderWithProviders(<CalendarToolbar month={SEPTEMBER} onMonth={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
  });

  it('writes the month in another locale when the reader uses one', () => {
    renderWithProviders(<CalendarToolbar month={SEPTEMBER} onMonth={vi.fn()} />, {
      locale: 'fr',
    });

    expect(screen.getByRole('heading', { name: 'septembre 2026' })).toBeInTheDocument();
  });

  it('steps to the month before and after', async () => {
    const onMonth = vi.fn();
    renderWithProviders(<CalendarToolbar month={SEPTEMBER} onMonth={onMonth} />);

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(onMonth).toHaveBeenNthCalledWith(1, new Date(2026, 7, 1));
    expect(onMonth).toHaveBeenNthCalledWith(2, new Date(2026, 9, 1));
  });

  it('spells out what each colour means', () => {
    renderWithProviders(<CalendarToolbar month={SEPTEMBER} onMonth={vi.fn()} />);

    for (const word of ['Scheduled', 'Publishing', 'Published', 'Failed']) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });
});
