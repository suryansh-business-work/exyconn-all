import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { PROPERTIES_PATH, PropertiesPage } from '../../../../src/pages/settings';
import { renderWithProviders } from '../../test-utils';
import { schemaResult } from './settings-schema-mock';

const gql = vi.hoisted(() => ({ properties: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmPropertiesQuery: (options: { variables: { object: CrmObject } }) =>
    gql.properties(options.variables.object),
  useCrmObjectSchemaQuery: ({ variables }: { variables: { object: CrmObject } }) =>
    schemaResult(variables.object),
  useDeleteCrmPropertyMutation: () => [vi.fn()],
}));

const introOf = (type: string) =>
  `The details kept on every ${type}. Built-in properties come with the CRM; add your own for anything else your team tracks.`;

describe('PropertiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.properties.mockReturnValue({
      data: { crmProperties: [] },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('lives under the settings properties route', () => {
    expect(PROPERTIES_PATH).toBe('/settings/properties');
  });

  it('opens on the leads tab and loads the lead properties', () => {
    renderWithProviders(<PropertiesPage />, { route: PROPERTIES_PATH });

    expect(screen.getByRole('heading', { name: 'Custom Properties' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Leads' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(introOf('lead'))).toBeInTheDocument();
    expect(gql.properties).toHaveBeenCalledWith(CrmObject.Lead);
  });

  it('shows each record type on its own tab slug', async () => {
    renderWithProviders(<PropertiesPage />, { route: `${PROPERTIES_PATH}/companies` });

    expect(screen.getByText(introOf('company'))).toBeInTheDocument();
    expect(gql.properties).toHaveBeenCalledWith(CrmObject.Company);

    await userEvent.click(screen.getByRole('tab', { name: 'Contacts' }));
    expect(await screen.findByText(introOf('contact'))).toBeInTheDocument();
    expect(gql.properties).toHaveBeenCalledWith(CrmObject.Contact);
  });
});
