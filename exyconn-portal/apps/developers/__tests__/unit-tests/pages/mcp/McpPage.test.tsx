import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { McpEndpoint, McpServersDocument } from '@exyconn/shell/graphql/generated';
import { appUrl } from '@exyconn/shell/config/apps';
import { renderWithProviders } from '../../test-utils';
import { McpPage } from '../../../../src/pages/mcp/McpPage';

const server = (endpoint: McpEndpoint, label: string, toolCount: number) => ({
  __typename: 'McpServer',
  endpoint,
  label,
  description: `${label} tools`,
  serverUrl: `https://portal-server.exyconn.com/mcp/${endpoint.toLowerCase()}`,
  toolCount,
  queryCount: 1,
  mutationCount: 1,
  connectionCount: 0,
});

const servers = (rows = [server(McpEndpoint.Crm, 'CRM', 42)], delay = 0) =>
  ({
    request: { query: McpServersDocument },
    result: { data: { mcpServers: rows } },
    delay,
  }) satisfies MockLink.MockedResponse;

describe('McpPage', () => {
  it('points into the MCP portal and lists each server with its address, tools and page', async () => {
    const { container } = renderWithProviders(<McpPage />, { mocks: [servers(undefined, 20)] });
    expect(screen.getByRole('heading', { name: 'Claude (MCP)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the MCP portal' })).toHaveAttribute(
      'href',
      appUrl('mcp', '/mcp'),
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    const row = (await screen.findByText('CRM')).closest('tr') as HTMLElement;
    expect(within(row).getByText('https://portal-server.exyconn.com/mcp/crm')).toBeInTheDocument();
    expect(within(row).getByText('42')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Connect' })).toHaveAttribute(
      'href',
      appUrl('mcp', '/mcp/crm'),
    );
  });

  it('reads the servers again on refresh', async () => {
    const user = userEvent.setup();
    renderWithProviders(<McpPage />, {
      mocks: [
        servers(),
        servers([server(McpEndpoint.Crm, 'CRM', 42), server(McpEndpoint.All, 'Everything', 400)]),
      ],
    });
    await screen.findByText('CRM');
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(await screen.findByText('Everything')).toBeInTheDocument();
  });

  it('says so when no server is open to the person', async () => {
    renderWithProviders(<McpPage />, { mocks: [servers([])] });
    expect(await screen.findByText('No MCP servers are open to you.')).toBeInTheDocument();
  });

  it('says why when the servers cannot be read', async () => {
    renderWithProviders(<McpPage />, {
      mocks: [{ request: { query: McpServersDocument }, error: new Error('Forbidden') }],
    });
    await waitFor(() =>
      expect(
        screen.getAllByRole('alert').some((el) => /Forbidden/.test(el.textContent ?? '')),
      ).toBe(true),
    );
    expect(screen.queryByRole('table')).toBeNull();
  });
});
