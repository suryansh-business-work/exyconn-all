import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AudienceSegment, CompanyStatus } from '@exyconn/shell/graphql/generated';
import {
  AudienceListForm,
  COMPANY_STATUS_OPTIONS,
  type AudienceRow,
} from '../../../../../../src/pages/audiences/forms/audience-list';
import { renderWithProviders } from '../../../../test-utils';
import { audienceRow } from '../../../../fixtures';
import { chooseMany, chooseOption, fill, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  clients: vi.fn(),
  contacts: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateAudienceListMutation: () => [gql.create],
  useUpdateAudienceListMutation: () => [gql.update],
  useListClientsQuery: () => gql.clients(),
  useListContactsQuery: () => gql.contacts(),
}));

const CLIENTS = [{ id: 'client-1', name: 'Acme Ltd', email: 'ops@acme.io' }];
const CONTACTS = [{ id: 'contact-1', name: 'Asha Rao', email: 'asha@acme.io' }];

function renderForm(initial: AudienceRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<AudienceListForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('AudienceListForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createAudienceList: { id: 'audience-9' } } });
    gql.update.mockResolvedValue({ data: { updateAudienceList: { id: 'audience-1' } } });
    gql.clients.mockReturnValue({ data: { listClients: CLIENTS } });
    gql.contacts.mockReturnValue({ data: { listContacts: CONTACTS } });
  });

  it('offers the CRM company statuses as segment values', () => {
    expect(COMPANY_STATUS_OPTIONS.map((option) => option.value)).toEqual(
      Object.values(CompanyStatus),
    );
  });

  it('requires a name', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('asks for people when no segment rule picks them', async () => {
    renderForm();
    fill('Audience name', 'Partners');

    await press('Create');

    expect(
      await screen.findByText('Pick some people, or choose a segment rule'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('labels clients and contacts by name and address', async () => {
    renderForm();

    expect(await optionsOf('Clients')).toEqual(['Acme Ltd · ops@acme.io']);
    expect(await optionsOf('CRM contacts')).toEqual(['Asha Rao · asha@acme.io']);
  });

  it('creates an audience from the chosen clients', async () => {
    const { onDone } = renderForm();
    fill('Audience name', '  Partners  ');
    await chooseMany('Clients', ['Acme Ltd · ops@acme.io']);

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Partners',
          description: '',
          clientIds: ['client-1'],
          contactIds: [],
          dynamicSegment: AudienceSegment.None,
          segmentValue: '',
        },
      },
    });
    expect(await screen.findByText('Audience created')).toBeInTheDocument();
  });

  it('asks which account status a company-status segment uses, then saves it', async () => {
    const { onDone } = renderForm();
    fill('Audience name', 'Customers');
    expect(screen.queryByRole('combobox', { name: /^Account status/ })).not.toBeInTheDocument();
    await chooseOption('Segment rule', 'Contacts By Company Status');

    await press('Create');
    expect(await screen.findByText('Choose the account status to segment on')).toBeInTheDocument();

    await chooseOption('Account status', 'Customer');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      dynamicSegment: AudienceSegment.ContactsByCompanyStatus,
      segmentValue: CompanyStatus.Customer,
      clientIds: [],
      contactIds: [],
    });
  });

  it('says where to add people while there are no clients or contacts', () => {
    gql.clients.mockReturnValue({ data: undefined });
    gql.contacts.mockReturnValue({ data: undefined });
    renderForm();

    expect(screen.getByText('No clients found — add clients first.')).toBeInTheDocument();
    expect(screen.getByText('No contacts found — add contacts first.')).toBeInTheDocument();
  });

  it('updates an existing audience by id, keeping its values', async () => {
    const { onDone } = renderForm(audienceRow({ id: 'audience-1' }));

    expect(screen.getByLabelText('Audience name')).toHaveValue('Newsletter');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'audience-1',
        input: {
          name: 'Newsletter',
          description: 'Monthly readers',
          clientIds: ['client-1'],
          contactIds: ['contact-1', 'contact-2'],
          dynamicSegment: AudienceSegment.None,
          segmentValue: '',
        },
      },
    });
    expect(await screen.findByText('Audience updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce(new Error('Name already used'));
    const { onDone } = renderForm(audienceRow());

    await press('Update');

    expect(await screen.findByText('Name already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands cancel back to the page', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
