import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GstStatesDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { BrandingForm } from '../../../../src/pages/branding/forms/branding';
import { branding } from './branding.fixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return { ...actual, useUpdateBrandingMutation: () => [vi.fn()] };
});

const gstStates = {
  request: { query: GstStatesDocument },
  result: {
    data: {
      gstStates: [
        { __typename: 'GstState', code: '27', name: 'Maharashtra' },
        { __typename: 'GstState', code: '29', name: 'Karnataka' },
      ],
    },
  },
};

const openTab = (slug: string, row = branding()) =>
  renderWithProviders(<BrandingForm initial={row} />, {
    route: `/admin/branding/${slug}`,
    mocks: [gstStates],
  });

const save = () => screen.getByRole('button', { name: 'Save changes' });

describe('Branding › Images', () => {
  it('lists every image with a light and a dark variant, the dark one optional', () => {
    openTab('images');
    const table = screen.getByRole('table', { name: 'Branding images' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Image', 'Light mode', 'Dark mode']);
    expect(within(table).getAllByRole('row')).toHaveLength(8);
    expect(within(table).getByText('Favicon (light)')).toBeInTheDocument();
    expect(within(table).getByText('Favicon (dark)')).toBeInTheDocument();
    expect(within(table).getAllByText('Empty uses the light image.')).toHaveLength(7);
  });

  it('takes a removed logo out of the live preview', async () => {
    const user = userEvent.setup();
    openTab('images', branding({ logoUrl: 'https://cdn.example.com/logo.png' }));
    expect(screen.getByRole('img', { name: 'Acme logo' })).toBeInTheDocument();

    const logoRow = screen.getByText('Logo (light)').closest('tr') as HTMLElement;
    await user.click(within(logoRow).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('img', { name: 'Acme logo' })).toBeNull();
    expect(screen.getByText('No logo')).toBeInTheDocument();
  });
});

describe('Branding › Colors', () => {
  it('shows each palette colour and rejects one that is not a 6-digit hex', async () => {
    const user = userEvent.setup();
    openTab('colors');
    for (const label of ['Primary', 'Secondary', 'Accent', 'Background', 'Text']) {
      expect(screen.getByRole('textbox', { name: label })).toBeInTheDocument();
    }
    const primary = screen.getByRole('textbox', { name: 'Primary' });
    await user.clear(primary);
    await user.type(primary, 'blue');
    await user.click(save());
    expect(await screen.findByText('Use a 6-digit hex colour, e.g. #155dfc')).toBeInTheDocument();
  });
});

describe('Branding › Contact & Social', () => {
  it('lists the contact details and profiles, and rejects a malformed email or URL', async () => {
    const user = userEvent.setup();
    openTab('contact');
    expect(screen.getByRole('textbox', { name: 'Copyright text' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'AmbitionBox' })).toHaveValue('');

    await user.clear(screen.getByRole('textbox', { name: 'Support email' }));
    await user.type(screen.getByRole('textbox', { name: 'Support email' }), 'support@');
    await user.type(screen.getByRole('textbox', { name: 'LinkedIn' }), 'linkedin');
    await user.click(save());
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid URL')).toBeInTheDocument();
  });
});

describe('Branding › Invoicing', () => {
  it('offers the GST states from the server and keeps the tax rate at 100% or less', async () => {
    const user = userEvent.setup();
    openTab('invoicing');
    await user.click(screen.getByRole('combobox', { name: /GST state/ }));
    expect(await screen.findByRole('option', { name: '27 — Maharashtra' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Not set' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    // The menu hides the rest of the form from assistive tech until it has fully closed.
    const rate = await screen.findByRole('spinbutton', { name: 'Default tax %' });
    await user.clear(rate);
    await user.type(rate, '101');
    await user.click(save());
    expect(await screen.findByText('Must be ≤ 100')).toBeInTheDocument();
  });
});

describe('Branding › Login Pages', () => {
  it('shows a card per portal and requires its name', async () => {
    const user = userEvent.setup();
    openTab('login-pages');
    expect(screen.getByText('finance')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Background' })).toHaveValue(
      'https://images.example.com/finance.jpg',
    );
    expect(screen.getByRole('textbox', { name: 'Accent colour' })).toHaveValue('#0ea5e9');

    const name = screen.getByRole('textbox', { name: 'Portal name' });
    expect(name).toHaveValue('Finance');
    await user.clear(name);
    await user.click(save());
    expect(await screen.findByText('Portal name is required')).toBeInTheDocument();
  });
});
