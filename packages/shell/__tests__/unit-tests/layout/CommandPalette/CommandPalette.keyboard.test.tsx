import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SERVER, openPalette, rows, whereNow } from './paletteHarness';

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return { env: { ...actual.env, portalApp: 'finance' } };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('moving through the command palette', () => {
  it('moves through the rows with the arrow keys, wrapping at both ends', async () => {
    const user = userEvent.setup();
    const { field } = openPalette();
    await user.type(field, 'inv');
    await screen.findByText('INV-0043', {}, SERVER);
    // "inv" also matches module labels for an admin; the server's rows come last.
    const total = rows().length;
    expect(rows()[0]).toHaveClass('Mui-selected');

    await user.keyboard('{ArrowUp}');
    expect(rows()[total - 1]).toHaveClass('Mui-selected');

    await user.keyboard('{ArrowDown}');
    expect(rows()[0]).toHaveClass('Mui-selected');

    await user.keyboard('{ArrowDown}');
    expect(rows()[1 % total]).toHaveClass('Mui-selected');
  });

  it('opens the highlighted row on Enter and closes', async () => {
    const user = userEvent.setup();
    const { field, onClose } = openPalette();
    await user.type(field, 'inv');
    await screen.findByText('INV-0043', {}, SERVER);

    await user.keyboard('{ArrowUp}{Enter}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(whereNow()).toHaveTextContent('/finance/invoices/i2');
  });

  it('follows the mouse and opens a clicked row', async () => {
    const user = userEvent.setup();
    const { field, onClose } = openPalette();
    await user.type(field, 'inv');
    const first = await screen.findByRole('button', { name: /INV-0042/ }, SERVER);

    await user.hover(first);
    expect(first).toHaveClass('Mui-selected');

    await user.click(first);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(whereNow()).toHaveTextContent('/finance/invoices/i1');
  });
});
