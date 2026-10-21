import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Role, TaxSystem } from '@/graphql/generated';
import { OrganizationForm, type OrganizationRow } from '@/pages/organizations/forms/organization';
import { renderWithProviders } from '../../../../test-utils';
import { organization } from '../../organizations.fixtures';

const hooks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), invite: vi.fn() }));

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCreateOrganizationMutation: () => [hooks.create],
  useUpdateOrganizationMutation: () => [hooks.update],
  useInviteOrganizationMembersMutation: () => [hooks.invite],
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

async function pick(user: User, field: RegExp, typed: string, option: string) {
  await user.type(screen.getByRole('combobox', { name: field }), typed);
  await user.click(await screen.findByRole('option', { name: option }));
}

/** The minimum a new company needs: a name and a currency. */
async function fillRequired(user: User) {
  await user.type(screen.getByRole('textbox', { name: /^Company name/ }), '  Fjord AS ');
  await pick(user, /^Currency/, 'Norwegian Krone', 'NOK — Norwegian Krone (kr)');
}

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** What create sends for a company given only a name, a currency and `patch`. */
const blankInput = (patch: Record<string, unknown> = {}) => ({
  name: 'Fjord AS',
  slug: undefined,
  legalName: '',
  industry: '',
  companySize: '',
  description: '',
  contactEmail: '',
  phone: '',
  website: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  currency: 'NOK',
  locale: 'en',
  timezone,
  fiscalYearStartMonth: 1,
  taxSystem: TaxSystem.None,
  registrationNumber: '',
  taxId: '',
  logoUrl: '',
  ...patch,
});

describe('OrganizationForm', () => {
  it('asks only for the company name and its currency; the country is optional', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Company name is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.queryByText('Pick a country from the list')).toBeNull();
    expect(hooks.create).not.toHaveBeenCalled();
  });

  it('refuses a handle that is not URL-safe, or too long to file under', async () => {
    const { user } = mount();
    const handle = screen.getByRole('textbox', { name: /^Handle\s*\*?$/ });
    await user.type(handle, 'Acme Ltd!');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Use lowercase letters, digits and dashes')).toBeInTheDocument();

    await user.clear(handle);
    await user.type(handle, 'a'.repeat(61));
    expect(await screen.findByText('Keep the handle under 60 characters')).toBeInTheDocument();
  });

  it('refuses a malformed contact email and website, and an empty language', async () => {
    const { user } = mount();
    await user.type(screen.getByRole('textbox', { name: /^Contact email\s*\*?$/ }), 'not-an-email');
    await user.type(screen.getByRole('textbox', { name: /^Website\s*\*?$/ }), 'acme.example');
    await user.clear(screen.getByRole('textbox', { name: /^Language/ }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Enter a full link starting with https://')).toBeInTheDocument();
    expect(screen.getByText('Pick the language its portal reads in')).toBeInTheDocument();
  });

  it('creates a company with the defaults it was not given, inviting nobody', async () => {
    hooks.create.mockResolvedValue({ data: { createOrganization: organization() } });
    const { user, onDone } = mount();
    expect(screen.getByText(/Made from the name when left blank/)).toBeInTheDocument();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Organization created')).toBeInTheDocument();
    expect(hooks.create).toHaveBeenCalledWith({ variables: { input: blankInput() } });
    expect(hooks.invite).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('creates a company with its details, then invites the people added', async () => {
    hooks.create.mockResolvedValue({ data: { createOrganization: organization({ id: 'org-9' }) } });
    hooks.invite.mockResolvedValue({ data: { inviteOrganizationMembers: [] } });
    const { user, onDone } = mount();
    await fillRequired(user);
    await user.type(screen.getByRole('textbox', { name: /^Handle\s*\*?$/ }), 'fjord');
    await user.type(
      screen.getByRole('textbox', { name: /^Website\s*\*?$/ }),
      'https://fjord.example',
    );
    await user.type(screen.getByRole('textbox', { name: /^City\s*\*?$/ }), 'Bergen');
    await pick(user, /^Country/, 'Norway', 'Norway');

    await user.click(screen.getByRole('button', { name: 'Add a person' }));
    await user.click(screen.getByRole('button', { name: 'Add a person' }));
    const names = screen.getAllByRole('textbox', { name: /^Name/ });
    const emails = screen.getAllByRole('textbox', { name: /^Email/ });
    expect(names).toHaveLength(2);
    await user.type(names[0], 'Kari Nordmann');
    await user.type(emails[0], 'kari@fjord.example');
    // The second row is taken back out before saving.
    await user.click(screen.getAllByRole('button', { name: 'Remove this person' })[1]);
    expect(screen.getAllByRole('textbox', { name: /^Name/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Organization created')).toBeInTheDocument();
    expect(hooks.create).toHaveBeenCalledWith({
      variables: {
        input: blankInput({
          slug: 'fjord',
          website: 'https://fjord.example',
          city: 'Bergen',
          country: 'NO',
        }),
      },
    });
    expect(hooks.invite).toHaveBeenCalledWith({
      variables: {
        organizationId: 'org-9',
        members: [{ name: 'Kari Nordmann', email: 'kari@fjord.example', roles: [Role.Employee] }],
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('asks for each invited person’s name and email', async () => {
    const { user } = mount();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Add a person' }));
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'nope');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter their name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(hooks.create).not.toHaveBeenCalled();
  });

  it('invites nobody when the created company comes back without an id', async () => {
    hooks.create.mockResolvedValue({ data: undefined });
    const { user, onDone } = mount();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Add a person' }));
    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Kari Nordmann');
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'kari@fjord.example');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(hooks.invite).not.toHaveBeenCalled();
  });

  it('edits everything but the handle, without the invite section', async () => {
    hooks.update.mockResolvedValue({ data: { updateOrganization: organization() } });
    const row = organization();
    const { user, onDone } = mount(row);
    const handle = screen.getByRole('textbox', { name: /^Handle\s*\*?$/ });
    expect(handle).toHaveValue('acme');
    expect(handle).toBeDisabled();
    expect(screen.getByText(/Set when the company was created/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a person' })).toBeNull();
    expect(screen.getByRole('textbox', { name: /^City\s*\*?$/ })).toHaveValue('Oslo');

    const name = screen.getByRole('textbox', { name: /^Company name/ });
    await user.clear(name);
    await user.type(name, 'Acme Group');
    await user.click(screen.getByRole('combobox', { name: /^Tax rules/ }));
    await user.click(await screen.findByRole('option', { name: 'VAT / sales tax (one rate)' }));
    await user.click(screen.getByRole('combobox', { name: /^Company size/ }));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: '201-500' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Organization updated')).toBeInTheDocument();
    expect(hooks.update).toHaveBeenCalledWith({
      variables: {
        id: 'org-1',
        input: {
          name: 'Acme Group',
          legalName: row.legalName,
          industry: row.industry,
          companySize: '201-500',
          description: row.description,
          contactEmail: row.contactEmail,
          phone: row.phone,
          website: row.website,
          addressLine1: row.addressLine1,
          addressLine2: row.addressLine2,
          city: row.city,
          region: row.region,
          postalCode: row.postalCode,
          country: 'NO',
          currency: 'NOK',
          locale: 'nb',
          timezone: 'Europe/Oslo',
          fiscalYearStartMonth: 4,
          taxSystem: TaxSystem.Vat,
          registrationNumber: row.registrationNumber,
          taxId: row.taxId,
          logoUrl: row.logoUrl,
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
