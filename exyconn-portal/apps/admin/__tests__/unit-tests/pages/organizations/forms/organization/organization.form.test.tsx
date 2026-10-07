import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaxSystem } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { OrganizationForm } from '../../../../../../src/pages/organizations/forms/organization';
import type { OrganizationRow } from '../../../../../../src/pages/organizations/forms/organization';
import { organization } from '../../organizations.fixtures';

const hooks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCreateOrganizationMutation: () => [hooks.create],
  useUpdateOrganizationMutation: () => [hooks.update],
}));

afterEach(() => vi.resetAllMocks());

function mount(initial: OrganizationRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<OrganizationForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { user, onDone, onCancel };
}

type User = ReturnType<typeof userEvent.setup>;

async function pick(user: User, field: string, typed: string, option: string) {
  await user.type(screen.getByRole('combobox', { name: field }), typed);
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('OrganizationForm', () => {
  it('asks for the company name and the standards its portal runs in', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Company name is required')).toBeInTheDocument();
    expect(screen.getByText('Pick the country the company operates in')).toBeInTheDocument();
    expect(screen.getByText('Pick the currency it keeps books in')).toBeInTheDocument();
    expect(hooks.create).not.toHaveBeenCalled();
  });

  it('refuses a handle that is not URL-safe, or too long to file under', async () => {
    const { user } = mount();
    const handle = screen.getByRole('textbox', { name: 'Handle' });
    await user.type(handle, 'Acme Ltd!');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Use lowercase letters, digits and dashes')).toBeInTheDocument();

    await user.clear(handle);
    await user.type(handle, 'a'.repeat(61));
    expect(await screen.findByText('Keep the handle under 60 characters')).toBeInTheDocument();
  });

  it('refuses a malformed contact email and an empty language', async () => {
    const { user } = mount();
    await user.type(screen.getByRole('textbox', { name: 'Contact email' }), 'not-an-email');
    await user.clear(screen.getByRole('textbox', { name: 'Language' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Pick the language its portal reads in')).toBeInTheDocument();
  });

  it('creates a company with its handle and the defaults it was not given', async () => {
    hooks.create.mockResolvedValue({ data: { createOrganization: organization() } });
    const { user, onDone } = mount();
    expect(screen.getByText('Left blank, made from the name')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Company name' }), '  Fjord AS ');
    await user.type(screen.getByRole('textbox', { name: 'Handle' }), 'fjord');
    await pick(user, 'Country', 'Norway', 'Norway');
    await pick(user, 'Currency', 'Norwegian Krone', 'Norwegian Krone (NOK)');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Organization created')).toBeInTheDocument();
    expect(hooks.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Fjord AS',
          slug: 'fjord',
          legalName: '',
          country: 'NO',
          currency: 'NOK',
          locale: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          fiscalYearStartMonth: 1,
          taxSystem: TaxSystem.None,
          contactEmail: '',
          logoUrl: '',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('edits everything but the handle, the month going out as a number', async () => {
    hooks.update.mockResolvedValue({ data: { updateOrganization: organization() } });
    const { user, onDone } = mount(organization());
    const handle = screen.getByRole('textbox', { name: 'Handle' });
    expect(handle).toHaveValue('acme');
    expect(handle).toBeDisabled();
    expect(screen.getByText('Set when the company was created')).toBeInTheDocument();

    const name = screen.getByRole('textbox', { name: 'Company name' });
    await user.clear(name);
    await user.type(name, 'Acme Group');
    await user.click(screen.getByRole('combobox', { name: 'Tax rules' }));
    await user.click(await screen.findByRole('option', { name: 'VAT / sales tax (one rate)' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Organization updated')).toBeInTheDocument();
    expect(hooks.update).toHaveBeenCalledWith({
      variables: {
        id: 'org-1',
        input: {
          name: 'Acme Group',
          logoUrl: 'https://cdn.example.com/acme.png',
          legalName: 'Acme Holdings Ltd',
          country: 'NO',
          currency: 'NOK',
          locale: 'nb',
          timezone: 'Europe/Oslo',
          contactEmail: 'ops@acme.example',
          taxSystem: TaxSystem.Vat,
          fiscalYearStartMonth: 4,
        },
      },
    });
    expect(hooks.create).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('asks for the logo again when the stored address is not a web address', async () => {
    const { user } = mount(organization({ logoUrl: 'not a url' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Upload the logo again')).toBeInTheDocument();
    expect(hooks.update).not.toHaveBeenCalled();
  });

  it('says why the company could not be saved, and stays open', async () => {
    hooks.update.mockRejectedValue(new Error('Handle already taken'));
    const { user, onDone } = mount(organization());
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Handle already taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    const { user, onCancel } = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(hooks.create).not.toHaveBeenCalled();
  });
});
