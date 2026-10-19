import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import type { RowAction } from '@exyconn/shell/components/data/DataTable';
import { PropertiesPanel } from '../../../../src/pages/settings/PropertiesPanel';
import type { PropertyTableRow } from '../../../../src/pages/settings/property-rows';
import { renderWithProviders } from '../../test-utils';
import { propertyRow } from './settings-fixtures';
import { schemaResult } from './settings-schema-mock';

/**
 * The row actions' own handlers, run against every row whether or not the table hides the button,
 * so the panel's guards and its last-resort error logging are checked on their own.
 */
const spies = vi.hoisted(() => ({ remove: vi.fn(), logError: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmPropertiesQuery: () => ({
    data: { crmProperties: [propertyRow({ id: 'prop-3', label: 'Tier' })] },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useCrmObjectSchemaQuery: ({ variables }: { variables: { object: CrmObject } }) =>
    schemaResult(variables.object),
  useCreateCrmPropertiesMutation: () => [vi.fn()],
  useUpdateCrmPropertyMutation: () => [vi.fn()],
}));

vi.mock('../../../../src/pages/settings/useRemoveProperty', () => ({
  useRemoveProperty: () => spies.remove,
}));

vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>();
  return { ...actual, portalLogger: { ...actual.portalLogger, error: spies.logError } };
});

vi.mock('@exyconn/shell/components/data/DataTable', () => ({
  DataTable: ({
    rows,
    actions,
  }: Readonly<{ rows: PropertyTableRow[]; actions: RowAction<PropertyTableRow>[] }>) => (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          {actions.map((action) => (
            <button key={action.ariaLabel} type="button" onClick={() => action.onClick(row)}>
              {`${action.ariaLabel}: ${row.label}`}
            </button>
          ))}
        </li>
      ))}
    </ul>
  ),
}));

const renderPanel = () =>
  renderWithProviders(<PropertiesPanel object={CrmObject.Lead} intro="Lead properties" />);

describe('PropertiesPanel row actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.remove.mockResolvedValue(undefined);
  });

  it('does nothing for a built-in property even if its buttons are reached', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Edit property: Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete property: Name' }));

    expect(screen.queryByRole('heading', { name: 'Edit property' })).not.toBeInTheDocument();
    expect(spies.remove).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Edit property: Tier' }));
    expect(await screen.findByRole('heading', { name: 'Edit property' })).toBeInTheDocument();
  });

  it('logs a delete that fails outside its own error handling', async () => {
    const failure = new Error('confirm provider missing');
    spies.remove.mockRejectedValueOnce(failure);
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Delete property: Tier' }));

    expect(spies.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'prop-3' }));
    await waitFor(() =>
      expect(spies.logError).toHaveBeenCalledWith('Deleting a CRM property failed', failure, {
        object: CrmObject.Lead,
      }),
    );
  });
});
