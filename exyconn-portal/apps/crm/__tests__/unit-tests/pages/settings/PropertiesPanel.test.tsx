import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { PropertiesPanel } from '../../../../src/pages/settings/PropertiesPanel';
import { renderWithProviders } from '../../test-utils';
import { press } from '../../form-helpers';
import { propertyRow } from './settings-fixtures';
import { schemaResult } from './settings-schema-mock';

const gql = vi.hoisted(() => ({
  properties: vi.fn(),
  schema: vi.fn(),
  remove: vi.fn(),
  can: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmPropertiesQuery: () => gql.properties(),
  useCrmObjectSchemaQuery: ({ variables }: { variables: { object: CrmObject } }) =>
    gql.schema(variables.object),
  useDeleteCrmPropertyMutation: () => [gql.remove],
  useCreateCrmPropertiesMutation: () => [vi.fn()],
  useUpdateCrmPropertyMutation: () => [vi.fn()],
}));

vi.mock('@exyconn/shell/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: gql.can, loading: false }),
}));

const INTRO = 'The details kept on every lead.';
const TIER = propertyRow({
  id: 'prop-2',
  key: 'tier',
  label: 'Tier',
  type: CrmPropertyType.Enum,
  required: true,
  description: 'Account tier',
  options: [
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
  ],
});

const refetch = vi.fn();
const loadedWith = (crmProperties: unknown[]) => ({
  data: { crmProperties },
  loading: false,
  error: undefined,
  refetch,
});

const renderPanel = () =>
  renderWithProviders(<PropertiesPanel object={CrmObject.Lead} intro={INTRO} />);

const rowOf = (label: string | RegExp) =>
  screen.getByRole('cell', { name: label }).closest('tr') as HTMLElement;

describe('PropertiesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.can.mockReturnValue(true);
    gql.properties.mockReturnValue(loadedWith([TIER]));
    gql.schema.mockImplementation(schemaResult);
    gql.remove.mockResolvedValue({ data: { deleteCrmProperty: true } });
  });

  it('lists the custom properties, then the built-in ones marked read-only', () => {
    renderPanel();

    expect(screen.getByText(INTRO)).toBeInTheDocument();
    const tier = within(rowOf('Tier'));
    expect(tier.getByText('tier')).toBeInTheDocument();
    expect(tier.getByText('Dropdown select')).toBeInTheDocument();
    expect(tier.getByText('Yes')).toBeInTheDocument();
    expect(tier.getByText('2')).toBeInTheDocument();
    expect(tier.getByText('Account tier')).toBeInTheDocument();
    expect(tier.queryByText('Built-in')).not.toBeInTheDocument();
    expect(tier.getByRole('button', { name: 'Edit property' })).toBeInTheDocument();
    expect(tier.getByRole('button', { name: 'Delete property' })).toBeInTheDocument();

    const email = within(rowOf(/^Email\s*Built-in$/));
    expect(email.getByText('Single-line text')).toBeInTheDocument();
    expect(email.queryByRole('button', { name: 'Edit property' })).not.toBeInTheDocument();
    expect(email.queryByRole('button', { name: 'Delete property' })).not.toBeInTheDocument();
    expect(screen.queryByText('No custom properties yet')).not.toBeInTheDocument();
  });

  it('shows No on an optional property', () => {
    gql.properties.mockReturnValue(loadedWith([propertyRow()]));
    renderPanel();

    expect(within(rowOf('Lead score')).getByText('No')).toBeInTheDocument();
  });

  it('invites the first custom property and opens the create form from there', async () => {
    gql.properties.mockReturnValue(loadedWith([]));
    renderPanel();

    expect(screen.getByText('No custom properties yet')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Create property' });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]);

    expect(await screen.findByRole('heading', { name: 'Create property' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Label\s*\*?$/)).toHaveValue('');
  });

  it('opens a custom property in the edit form and closes it on cancel', async () => {
    renderPanel();

    await userEvent.click(within(rowOf('Tier')).getByRole('button', { name: 'Edit property' }));

    expect(await screen.findByRole('heading', { name: 'Edit property' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Label\s*\*?$/)).toHaveValue('Tier');
    await press('Cancel');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Edit property' })).not.toBeInTheDocument(),
    );
  });

  it('deletes a custom property after the confirmation', async () => {
    renderPanel();

    await userEvent.click(within(rowOf('Tier')).getByRole('button', { name: 'Delete property' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'prop-2' } }));
    expect(await screen.findByText('Property "Tier" deleted')).toBeInTheDocument();
  });

  it('offers no create, edit or delete without the permission', () => {
    gql.can.mockReturnValue(false);
    gql.properties.mockReturnValue(loadedWith([]));
    renderPanel();

    expect(gql.can).toHaveBeenCalledWith('CrmProperty', 'create');
    expect(screen.getByText('No custom properties yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create property' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit property' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete property' })).not.toBeInTheDocument();
  });

  it('shows a loading table until the properties first arrive', () => {
    gql.properties.mockReturnValue({ data: undefined, loading: true, error: undefined, refetch });
    renderPanel();

    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('No custom properties yet')).not.toBeInTheDocument();
  });

  it('reports why the properties could not load', () => {
    gql.properties.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Network down'),
      refetch,
    });
    renderPanel();

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
  });

  it('reports a schema failure with a plain message when it has no reason', () => {
    gql.schema.mockImplementation((object: CrmObject) => ({
      ...schemaResult(object),
      error: { code: 'NETWORK' },
    }));
    renderPanel();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the properties');
  });

  it('re-reads the custom properties and the schema on refresh', async () => {
    renderPanel();

    await press('Refresh table');

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(schemaResult(CrmObject.Lead).refetch).toHaveBeenCalled();
  });
});
