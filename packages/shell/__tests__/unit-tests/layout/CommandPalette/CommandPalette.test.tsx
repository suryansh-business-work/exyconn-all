import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SERVER, invoiceHits, nothing, openPalette, rows } from './paletteHarness';

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return { env: { ...actual.env, portalApp: 'finance' } };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the command palette', () => {
  it('opens on an empty field with nothing listed', () => {
    const { field } = openPalette();

    expect(field).toHaveValue('');
    expect(rows()).toHaveLength(0);
    expect(screen.queryByText(/Nothing matched/)).not.toBeInTheDocument();
  });

  it('matches modules at once, before the server has answered', async () => {
    const user = userEvent.setup();
    const { field } = openPalette([nothing('finance').mock]);

    await user.type(field, 'finance');

    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Finance/ })).toHaveTextContent('Open this module');
  });

  it('lists what the server found under its own heading', async () => {
    const user = userEvent.setup();
    const hits = invoiceHits();
    const { field } = openPalette([hits.mock]);

    await user.type(field, 'inv');

    expect(await screen.findByText('INV-0042', {}, SERVER)).toBeInTheDocument();
    expect(screen.getByText('Acme Ltd')).toBeInTheDocument();
    // A hit with no subtitle draws just its title.
    expect(screen.getByRole('button', { name: 'INV-0043' })).toBeInTheDocument();
    expect(hits.delivered()).toBe(true);
  });

  it('says so when nothing matched, and the keys do nothing', async () => {
    const user = userEvent.setup();
    const empty = nothing('zzqx');
    const { field, onClose } = openPalette([empty.mock]);

    await user.type(field, 'zzqx');
    await waitFor(() => expect(empty.delivered()).toBe(true), SERVER);

    expect(
      await screen.findByText('Nothing matched. Try a name, a reference or a number.', {}, SERVER),
    ).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not ask the server about a single character', async () => {
    const user = userEvent.setup();
    const { field } = openPalette([]);

    await user.type(field, 'q');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nothing matched/)).not.toBeInTheDocument();
  });

  it('starts from a clean field every time it opens', async () => {
    const user = userEvent.setup();
    const { field } = openPalette([nothing('finance').mock]);
    await user.type(field, 'finance');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByRole('textbox', { name: 'Search the portal' })).toHaveValue('');
  });

  it('offers no modules to somebody signed out', async () => {
    const user = userEvent.setup();
    const { field } = openPalette([nothing('finance').mock], null);

    await user.type(field, 'finance');

    expect(screen.queryByText('Modules')).not.toBeInTheDocument();
  });
});
