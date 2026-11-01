import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  ApiReferenceDocument,
  McpEndpoint,
  McpServersDocument,
  McpToolKind,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { ApiReferencePage } from '../../../../src/pages/reference/ApiReferencePage';
import { mcpServer, operation } from './reference.fixtures';

const SERVERS = [
  mcpServer(McpEndpoint.All, 'Everything'),
  mcpServer(McpEndpoint.Crm, 'CRM'),
  mcpServer(McpEndpoint.Finance, 'Finance'),
];

const servers = (rows = SERVERS): MockLink.MockedResponse => ({
  request: { query: McpServersDocument },
  result: { data: { mcpServers: rows } },
});

const reference = (endpoint: McpEndpoint, rows = [operation()], delay = 0) =>
  ({
    request: { query: ApiReferenceDocument, variables: { endpoint } },
    result: { data: { apiReference: rows } },
    delay,
  }) satisfies MockLink.MockedResponse;

const CRM_OPERATIONS = [
  operation(),
  operation({ name: 'createDeal', kind: McpToolKind.Mutation, description: 'Opens a deal.' }),
];

function Url() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

function renderPage(mocks: MockLink.MockedResponse[], route = '/developers/reference') {
  return renderWithProviders(
    <>
      <ApiReferencePage />
      <Url />
    </>,
    { mocks, route },
  );
}

describe('ApiReferencePage', () => {
  it('opens on the first module (never ALL) and lists its operations', async () => {
    renderPage([servers(), reference(McpEndpoint.Crm, CRM_OPERATIONS, 20)]);
    expect(screen.getByRole('heading', { name: 'API reference' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: /listLeads/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /createDeal/ })).toBeInTheDocument();
    expect(screen.getByText('2 operations')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Module' })).toHaveTextContent('CRM');

    await userEvent.setup().click(screen.getByRole('combobox', { name: 'Module' }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['CRM', 'Finance']);
  });

  it('opens on the module named in the URL', async () => {
    renderPage(
      [servers(), reference(McpEndpoint.Finance, [operation({ name: 'listInvoices' })])],
      '/developers/reference?module=FINANCE',
    );
    expect(await screen.findByRole('button', { name: /listInvoices/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Module' })).toHaveTextContent('Finance');
  });

  it('ignores a module in the URL that does not exist', async () => {
    renderPage([servers(), reference(McpEndpoint.Crm)], '/developers/reference?module=NOPE');
    expect(await screen.findByRole('button', { name: /listLeads/ })).toBeInTheDocument();
  });

  it('switches module through the picker, keeping it in the URL', async () => {
    const user = userEvent.setup();
    renderPage([
      servers(),
      reference(McpEndpoint.Crm),
      reference(McpEndpoint.Finance, [operation({ name: 'listInvoices' })]),
    ]);
    await screen.findByRole('button', { name: /listLeads/ });

    await user.click(screen.getByRole('combobox', { name: 'Module' }));
    await user.click(screen.getByRole('option', { name: 'Finance' }));

    expect(await screen.findByRole('button', { name: /listInvoices/ })).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('/developers/reference?module=FINANCE');
  });

  it('filters by name or description, whatever the case, and says when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage([servers(), reference(McpEndpoint.Crm, CRM_OPERATIONS)]);
    await screen.findByRole('button', { name: /listLeads/ });
    const search = screen.getByRole('textbox', { name: 'Search operations' });

    await user.type(search, '  DEAL ');
    expect(screen.queryByRole('button', { name: /listLeads/ })).toBeNull();
    expect(screen.getByRole('button', { name: /createDeal/ })).toBeInTheDocument();
    expect(screen.getByText('1 operations')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'the leads');
    expect(screen.getByRole('button', { name: /listLeads/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /createDeal/ })).toBeNull();

    await user.clear(search);
    await user.type(search, 'payroll');
    expect(screen.getByText('No operations match')).toBeInTheDocument();
    expect(screen.getByText('0 operations')).toBeInTheDocument();
  });

  it('asks for no reference when no module is open, and shows none', async () => {
    renderPage([servers([mcpServer(McpEndpoint.All, 'Everything')])]);
    expect(await screen.findByText('No operations match')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Module' })).not.toHaveTextContent('Everything');
    expect(screen.getByText('0 operations')).toBeInTheDocument();
  });

  it('says why when the modules cannot be read', async () => {
    renderPage([{ request: { query: McpServersDocument }, error: new Error('Forbidden') }]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('says why when the reference cannot be read', async () => {
    renderPage([
      servers(),
      {
        request: { query: ApiReferenceDocument, variables: { endpoint: McpEndpoint.Crm } },
        error: new Error('Schema unavailable'),
      },
    ]);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Schema unavailable'));
  });
});
