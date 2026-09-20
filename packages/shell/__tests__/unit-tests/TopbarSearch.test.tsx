import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopbarSearch } from '@/layout/PortalLayout/TopbarSearch';

/**
 * What sat here was an autocomplete over the module list; it is now the way into the command
 * palette, which searches records as well. All this has to do is open it and say how.
 */
describe('the topbar search button', () => {
  it('opens the palette when pressed', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<TopbarSearch onOpen={onOpen} />);

    await user.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows the shortcut, so people stop reaching for the mouse', () => {
    render(<TopbarSearch onOpen={vi.fn()} />);

    expect(screen.getByRole('button').textContent).toMatch(/⌘K|Ctrl K/);
  });
});
