import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceRecipientSource } from '@exyconn/shell/graphql/generated';
import { AudienceDataSources } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceDataSources';
import { renderWithProviders } from '../../../../test-utils';
import { answered, pending } from '../../../../fixtures';
import { chooseMany, optionsOf, press } from '../../../../form-helpers';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

const gql = vi.hoisted(() => ({ clients: vi.fn(), contacts: vi.fn(), companies: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListClientsQuery: () => gql.clients(),
  useListContactsQuery: () => gql.contacts(),
  useListCompaniesQuery: () => gql.companies(),
}));

function renderSources(recipientSource = AudienceRecipientSource.Both) {
  const probe = formProbe();
  renderWithProviders(
    <AudienceFormHarness values={{ recipientSource }} capture={probe.capture}>
      <AudienceDataSources />
    </AudienceFormHarness>,
  );
  return probe;
}

describe('AudienceDataSources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.clients.mockReturnValue(
      answered({
        listClients: [
          { id: 'c1', name: 'Acme Ltd', email: 'billing@acme.io' },
          { id: 'c2', name: 'Walk-in', email: '' },
        ],
      }),
    );
    gql.contacts.mockReturnValue(
      answered({ listContacts: [{ id: 'p1', name: 'Priya Shah', email: 'priya@urbancafe.in' }] }),
    );
    gql.companies.mockReturnValue(
      answered({ listCompanies: [{ id: 'co1', name: 'Urban Café', domain: 'urbancafe.in' }] }),
    );
  });

  it('names each record with its address, or its name alone without one', async () => {
    renderSources();

    expect(await optionsOf('CRM contacts')).toEqual(['Priya Shah · priya@urbancafe.in']);
    expect(await optionsOf('CRM companies')).toEqual(['Urban Café · urbancafe.in']);
    expect(await optionsOf('Clients')).toEqual(['Acme Ltd · billing@acme.io', 'Walk-in']);
    expect(screen.queryByText(/found — add/)).toBeNull();
  });

  it('writes the picked records, the active-clients switch and the exclusions to the form', async () => {
    const probe = renderSources();

    await chooseMany('CRM contacts', ['Priya Shah · priya@urbancafe.in']);
    await chooseMany('CRM companies', ['Urban Café · urbancafe.in']);
    await chooseMany('Clients', ['Walk-in']);
    await userEvent.click(screen.getByRole('switch', { name: 'Include every active client' }));
    const exclude = screen.getByRole('combobox', { name: 'Exclude these addresses' });
    await userEvent.type(exclude, 'ceo@acme.io{Enter}');

    expect(probe.values()).toMatchObject({
      contactIds: ['p1'],
      companyIds: ['co1'],
      clientIds: ['c2'],
      allActiveClients: true,
      excludedEmails: ['ceo@acme.io'],
    });
  });

  it('refuses an excluded entry that is not an email address', async () => {
    renderSources();
    const exclude = screen.getByRole('combobox', { name: 'Exclude these addresses' });
    await userEvent.type(exclude, 'not-an-email{Enter}');
    fireEvent.blur(exclude);

    await press('Check');

    expect(
      await screen.findByText('Every excluded address must be a valid email'),
    ).toBeInTheDocument();
  });

  it('asks for a record when only picked records are used', async () => {
    renderSources(AudienceRecipientSource.SelectedOnly);

    await press('Check');

    expect(
      await screen.findByText('Pick some records, or choose Contacts, Companies or Both'),
    ).toBeInTheDocument();
  });

  it('says what to add first while a register is empty or still loading', () => {
    gql.clients.mockReturnValue(answered({ listClients: [] }));
    gql.contacts.mockReturnValue(pending());
    gql.companies.mockReturnValue(pending());
    renderSources();

    expect(screen.getByText('No contacts found — add contacts first.')).toBeInTheDocument();
    expect(screen.getByText('No companies found — add companies first.')).toBeInTheDocument();
    expect(screen.getByText('No clients found — add clients first.')).toBeInTheDocument();
  });
});
