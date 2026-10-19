import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmObject,
  CrmObjectSchemaDocument,
  CrmPropertiesDocument,
  CrmPropertyType,
} from '@exyconn/shell/graphql/generated';
import { CrmPropertyForm } from '../../../../../../src/pages/settings/forms/crm-property';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../../../../form-helpers';
import { propertyRow } from '../../settings-fixtures';
import { schemaResult } from '../../settings-schema-mock';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), updateOptions: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCrmPropertiesMutation: () => [gql.create],
  useUpdateCrmPropertyMutation: (options: unknown) => {
    gql.updateOptions(options);
    return [gql.update];
  },
  // Leads already use `email`; companies and contacts only their names.
  useCrmObjectSchemaQuery: ({ variables }: { variables: { object: CrmObject } }) =>
    schemaResult(variables.object),
}));

type Row = ReturnType<typeof propertyRow>;

function renderForm(initial: Row | null = null, object = CrmObject.Lead) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CrmPropertyForm object={object} initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

const AUTO_HINT =
  'Made from the label as you type; edit it to choose your own. Used in imports, exports and the API, and fixed once saved.';
const FIXED_HINT = 'Used in imports, exports and the API. It cannot change once saved.';

const refetchesFor = (object: CrmObject) => [
  { query: CrmObjectSchemaDocument, variables: { object } },
  { query: CrmPropertiesDocument, variables: { object } },
];

const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const choiceRow = (number: number) => screen.getByRole('group', { name: `Choice ${number}` });

async function pickType(name: string) {
  await userEvent.click(screen.getByRole('combobox', { name: /^Type/ }));
  const listbox = screen.getByRole('listbox');
  await userEvent.click(within(listbox).getByRole('option', { name: new RegExp(`^${name}`) }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

async function addChoice(label: string) {
  await press('Add choice');
  const rows = screen.getAllByRole('group', { name: /^Choice \d+$/ });
  await userEvent.type(within(rows.at(-1) as HTMLElement).getByLabelText('Choice'), label);
}

describe('CrmPropertyForm: creating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCrmProperties: [] } });
    gql.update.mockResolvedValue({ data: { updateCrmProperty: { id: 'prop-1' } } });
  });

  it('makes the key from the label until the key is edited by hand', async () => {
    renderForm();

    await fillField('Label', 'Lead score (0-100)');
    expect(screen.getByLabelText('Key')).toHaveValue('lead_score_0_100');
    expect(screen.getByText(AUTO_HINT)).toBeInTheDocument();

    await fillField('Key', 'score');
    await fillField('Label', 'Something else');
    expect(screen.getByLabelText('Key')).toHaveValue('score');
    expect(screen.getByText(FIXED_HINT)).toBeInTheDocument();
  });

  it('clears an "Enter a key" error as soon as the label fills the key in', async () => {
    renderForm();

    await userEvent.click(screen.getByLabelText('Key'));
    await userEvent.tab();
    expect(await screen.findByText('Enter a key')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Label'), 'Tier');
    await waitFor(() => expect(screen.queryByText('Enter a key')).not.toBeInTheDocument());
  });

  it('creates the property on every chosen record type and re-reads each of them', async () => {
    const { onDone } = renderForm(null, CrmObject.Contact);
    await fillField('Label', 'Region');
    await userEvent.click(checkbox('Leads'));
    await userEvent.click(screen.getByLabelText('Help text'));
    await userEvent.paste('Sales region');
    await userEvent.click(screen.getByRole('switch', { name: 'Required on every record' }));

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Region',
          options: [],
          required: true,
          description: 'Sales region',
          objects: [CrmObject.Lead, CrmObject.Contact],
          key: 'region',
          type: CrmPropertyType.Text,
        },
      },
      refetchQueries: [...refetchesFor(CrmObject.Lead), ...refetchesFor(CrmObject.Contact)],
    });
    expect(await screen.findByText('Property "Region" created')).toBeInTheDocument();
  });

  it('ticks every record type at once, shows a partial choice, and clears them all', async () => {
    renderForm();
    const all = checkbox('All record types');
    expect(all).not.toBeChecked();
    expect(all).toHaveAttribute('data-indeterminate', 'true');

    await userEvent.click(all);
    expect(checkbox('Leads')).toBeChecked();
    expect(checkbox('Companies')).toBeChecked();
    expect(checkbox('Contacts')).toBeChecked();
    expect(all).toBeChecked();

    await userEvent.click(all);
    expect(checkbox('Leads')).not.toBeChecked();
    expect(all).toHaveAttribute('data-indeterminate', 'false');

    await fillField('Label', 'Region');
    await press('Create');
    expect(await screen.findByText('Choose at least one record type')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a key a chosen record type already uses', async () => {
    renderForm();
    await fillField('Label', 'Email');

    await press('Create');

    expect(
      await screen.findByText('Leads already have a property with this key'),
    ).toBeInTheDocument();
    await userEvent.click(checkbox('Leads'));
    await userEvent.click(checkbox('Companies'));
    await press('Create');
    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
  });

  it('describes the chosen type and asks for choices on a dropdown', async () => {
    renderForm();
    expect(screen.getByText('A name, a code or a short answer')).toBeInTheDocument();

    await pickType('Dropdown select');
    expect(screen.getByText('One choice from a list you set')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Choices' })).toBeInTheDocument();
    await fillField('Label', 'Tier');
    await press('Create');

    expect(await screen.findByRole('alert')).toHaveTextContent('Add 1 to 100 choices');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('values each new choice from its label, reorders and removes them', async () => {
    const { onDone } = renderForm();
    await fillField('Label', 'Tier');
    await pickType('Radio buttons');
    await addChoice('Gold tier');
    await addChoice('Silver');
    await addChoice('Bronze');
    expect(within(choiceRow(1)).getByLabelText('Value')).toHaveValue('gold_tier');

    const first = within(choiceRow(1));
    expect(first.getByRole('button', { name: 'Move choice 1 up' })).toBeDisabled();
    expect(within(choiceRow(3)).getByRole('button', { name: 'Move choice 3 down' })).toBeDisabled();
    await userEvent.click(first.getByRole('button', { name: 'Move choice 1 down' }));
    await userEvent.click(within(choiceRow(3)).getByRole('button', { name: 'Move choice 3 up' }));
    await userEvent.click(within(choiceRow(3)).getByRole('button', { name: 'Remove choice 3' }));
    await userEvent.clear(within(choiceRow(1)).getByLabelText('Value'));
    await userEvent.type(within(choiceRow(1)).getByLabelText('Value'), 'ag');
    await userEvent.type(within(choiceRow(1)).getByLabelText('Choice'), ' plus');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input.options).toEqual([
      { value: 'ag', label: 'Silver plus' },
      { value: 'bronze', label: 'Bronze' },
    ]);
  });

  it('keeps the form open with the server reason when the save fails', async () => {
    gql.create.mockRejectedValueOnce(new Error('Key already exists'));
    const { onDone } = renderForm();
    await fillField('Label', 'Region');

    await press('Create');

    expect(await screen.findByText('Key already exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});

describe('CrmPropertyForm: editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.update.mockResolvedValue({ data: { updateCrmProperty: { id: 'prop-1' } } });
  });

  it('locks the key and type, keeps saved choice values, and updates by id', async () => {
    const row = propertyRow({
      id: 'prop-4',
      key: 'email',
      label: 'Tier',
      type: CrmPropertyType.Enum,
      options: [{ value: 'gold', label: 'Gold' }],
    });
    const { onDone } = renderForm(row, CrmObject.Lead);

    expect(screen.getByLabelText('Key')).toBeDisabled();
    expect(screen.getByText(FIXED_HINT)).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toHaveValue('Dropdown select');
    expect(screen.getByLabelText('Type')).toBeDisabled();
    expect(within(choiceRow(1)).getByLabelText('Value')).toBeDisabled();
    expect(screen.getByText('Saved choices keep their value')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Leads' })).not.toBeInTheDocument();

    await userEvent.type(within(choiceRow(1)).getByLabelText('Choice'), ' plus');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'prop-4',
        input: {
          label: 'Tier',
          options: [{ value: 'gold', label: 'Gold plus' }],
          required: false,
          description: '',
        },
      },
    });
    expect(gql.updateOptions).toHaveBeenCalledWith({
      refetchQueries: refetchesFor(CrmObject.Lead),
    });
    expect(await screen.findByText('Property "Tier" updated')).toBeInTheDocument();
  });

  it('shows no choices for a type without them', () => {
    renderForm(propertyRow(), CrmObject.Lead);

    expect(screen.getByLabelText('Type')).toHaveValue('Number');
    expect(screen.queryByRole('heading', { name: 'Choices' })).not.toBeInTheDocument();
  });

  it('falls back to a plain message when the update fails without a reason', async () => {
    gql.update.mockRejectedValueOnce({ code: 'NETWORK' });
    renderForm(propertyRow(), CrmObject.Lead);

    await press('Update');

    expect(await screen.findByText('Could not save the property')).toBeInTheDocument();
  });
});
