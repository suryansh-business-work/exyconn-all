import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AudienceEmailSelection,
  AudienceRecipientSource,
  AudienceRuleOperator,
  AudienceUpdateMode,
  type AudienceListInput,
} from '@exyconn/shell/graphql/generated';
import {
  AudienceListForm,
  toFormValues,
  toInput,
} from '../../../../../../src/pages/audiences/forms/audience-list';
import { renderWithProviders } from '../../../../test-utils';
import { answered, audienceRow, pending } from '../../../../fixtures';
import { fill, optionsOf, press } from '../../../../form-helpers';
import { FILTER_FIELDS, audienceCounts } from '../../audience.fixtures';

const gql = vi.hoisted(() => ({
  catalogue: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  preview: vi.fn(),
}));

vi.mock('@apollo/client/react', async (importOriginal) => {
  const client = { query: gql.preview };
  return {
    ...(await importOriginal<typeof import('@apollo/client/react')>()),
    useApolloClient: () => client,
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceFilterCatalogueQuery: () => gql.catalogue(),
  useCreateAudienceListMutation: () => [gql.create],
  useUpdateAudienceListMutation: () => [gql.update],
  useAudienceFilterValuesQuery: () => answered({ audienceFilterValues: [] }),
  useListClientsQuery: () => answered({ listClients: [] }),
  useListContactsQuery: () => answered({ listContacts: [] }),
  useListCompaniesQuery: () => answered({ listCompanies: [] }),
}));

const CATALOGUE = answered({
  audienceFilterCatalogue: { emailTypes: ['Sales', 'Support'], fields: FILTER_FIELDS },
});

function renderForm(initial = null as ReturnType<typeof audienceRow> | null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<AudienceListForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

/** The name field carries a required mark after its label. */
const fillName = (value: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: /^Audience name/ }), { target: { value } });

/** The settings the live counts were last asked for. */
const lastPreviewInput = (): AudienceListInput =>
  gql.preview.mock.calls[gql.preview.mock.calls.length - 1][0].variables.input;

describe('AudienceListForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.catalogue.mockReturnValue(CATALOGUE);
    gql.create.mockResolvedValue({ data: { createAudienceList: audienceRow() } });
    gql.update.mockResolvedValue({ data: { updateAudienceList: audienceRow() } });
    gql.preview.mockResolvedValue({
      data: {
        previewAudience: { resolvedAt: '2026-10-20T09:00:00.000Z', counts: audienceCounts() },
      },
    });
  });

  it('lays the builder out as named sections, starting from the recommended settings', () => {
    renderForm();

    for (const section of [
      'Audience',
      'Recipient source',
      'Email address selection',
      'Audience update mode',
      'Advanced filters',
      'Data sources',
      'Live audience preview',
    ]) {
      expect(screen.getByRole('region', { name: section })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: /Preferred \/ primary email/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Live dynamic audience/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('requires a name before anything is saved', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates the audience with the recommended settings and says so', async () => {
    const { onDone } = renderForm();
    fillName('  Delhi cafés  ');
    fill('Description', 'Café owners in Delhi');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: toInput({
          ...toFormValues(null),
          name: 'Delhi cafés',
          description: 'Café owners in Delhi',
        }),
      },
    });
    expect(await screen.findByText('Audience created')).toBeInTheDocument();
  });

  it('shows the live counts of the settings in the form', async () => {
    renderForm();
    fillName('Cafés');

    await waitFor(() => expect(lastPreviewInput().name).toBe('Cafés'));
    // The tile and the pinned summary both show the final figure.
    expect(await screen.findAllByText('1,430')).toHaveLength(2);
  });

  it('leaves a condition out of the live counts until it is complete', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    fillName('With a blank rule');

    await waitFor(() => expect(lastPreviewInput().name).toBe('With a blank rule'));
    expect(lastPreviewInput().conditions).toEqual([]);
  });

  it('offers the CRM’s email types once selected types are chosen', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('radio', { name: /Selected email types/ }));

    expect(await optionsOf('Email types')).toEqual(['Sales', 'Support']);
  });

  it('waits for the field catalogue before a condition can be added', () => {
    gql.catalogue.mockReturnValue(pending());
    renderForm();

    expect(screen.getByRole('button', { name: 'Add condition' })).toBeDisabled();
  });

  it('edits a saved audience in place', async () => {
    const row = audienceRow({
      id: 'audience-9',
      recipientSource: AudienceRecipientSource.Contacts,
      emailSelection: AudienceEmailSelection.All,
      updateMode: AudienceUpdateMode.FixedSnapshot,
      snapshotAt: '2026-10-01T08:30:00.000Z',
      conditions: [
        { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Delhi' },
      ],
    });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText(/Audience name/)).toHaveValue('Newsletter');
    expect(screen.getByRole('group', { name: 'Condition 1' })).toBeInTheDocument();
    expect(screen.getByText(/^Frozen on /)).toBeInTheDocument();
    fillName('Newsletter — Delhi');

    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'audience-9',
        input: expect.objectContaining({
          name: 'Newsletter — Delhi',
          recipientSource: AudienceRecipientSource.Contacts,
          emailSelection: AudienceEmailSelection.All,
          updateMode: AudienceUpdateMode.FixedSnapshot,
          conditions: [
            { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Delhi' },
          ],
        }),
      },
    });
    expect(gql.create).not.toHaveBeenCalled();
    expect(await screen.findByText('Audience updated')).toBeInTheDocument();
  });

  it('keeps the form open and shows why when the save fails', async () => {
    gql.create.mockRejectedValue(new Error('An audience with this name already exists'));
    const { onDone } = renderForm();
    fillName('Newsletter');

    await press('Create');

    expect(
      await screen.findByText('An audience with this name already exists'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
