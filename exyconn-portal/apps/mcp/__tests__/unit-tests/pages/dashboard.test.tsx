import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { McpDashboardPage } from '../../../src/pages/dashboard';
import { renderWithProviders, useCurrentUrl } from '../test-utils';

const gql = vi.hoisted(() => ({ servers: vi.fn(), usage: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMcpServersQuery: gql.servers,
  useMcpUsageQuery: gql.usage,
}));
vi.mock('@exyconn/shell/components/dashboard/PointChart', () => ({
  PointChart: ({
    title,
    points,
  }: Readonly<{ title: string; points: { period: string; value: number }[] }>) => (
    <p>{`${title}: ${points.map((p) => p.value).join(',')}`}</p>
  ),
}));
vi.mock('@exyconn/shell/components/dashboard/MetricChart', () => ({
  MetricChart: ({ title, metrics }: Readonly<{ title: string; metrics: { label: string }[] }>) => (
    <p>{`${title}: ${metrics.map((m) => m.label).join(',')}`}</p>
  ),
}));

const server = (endpoint: McpEndpoint, label: string, toolCount: number) => ({
  endpoint,
  label,
  description: `${label} tools for Claude.`,
  serverUrl: `https://portal-server.exyconn.com/mcp/${endpoint.toLowerCase()}`,
  toolCount,
  queryCount: toolCount,
  mutationCount: 0,
  connectionCount: 2,
});
const SERVERS = [
  server(McpEndpoint.Crm, 'CRM', 120),
  server(McpEndpoint.Marketing, 'Marketing', 60),
  server(McpEndpoint.All, 'All Exyconn tools', 180),
];

function Url() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

const renderDashboard = () =>
  renderWithProviders(
    <Routes>
      <Route path="/mcp" element={<McpDashboardPage />} />
      <Route path="*" element={<Url />} />
    </Routes>,
    { route: '/mcp' },
  );

describe('McpDashboardPage', () => {
  beforeEach(() => {
    gql.servers.mockReset().mockReturnValue({ data: { mcpServers: SERVERS }, loading: false });
    gql.usage.mockReset().mockReturnValue({
      data: {
        mcpUsage: {
          calls: 9,
          failures: 1,
          people: 2,
          days: [{ day: '2026-10-24', calls: 9, failures: 1 }],
          tools: [{ tool: 'searchLeads', calls: 9, failures: 1, averageMs: 10 }],
          users: [{ userName: 'Asha', calls: 9 }],
        },
      },
    });
  });

  it('shows every server with its tools and connections, and 30 days of use across them', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'MCP dashboard' })).toBeInTheDocument();
    for (const label of ['CRM', 'Marketing', 'All Exyconn tools']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('120 tools · 2 connections')).toBeInTheDocument();
    expect(gql.usage).toHaveBeenCalledWith({
      variables: { endpoint: McpEndpoint.All, days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Calls per day: 9')).toBeInTheDocument();
    expect(screen.getByText('Most used tools: searchLeads')).toBeInTheDocument();
  });

  it('opens a server to connect it or read its activity', async () => {
    renderDashboard();
    await userEvent.click(screen.getAllByRole('button', { name: 'Activity' })[1]);
    expect(screen.getByTestId('url')).toHaveTextContent('/mcp/marketing/activity');
  });

  it('opens a server on its connect tab', async () => {
    renderDashboard();
    await userEvent.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    expect(screen.getByTestId('url')).toHaveTextContent('/mcp/crm/setup');
  });

  it('says when the person has no server, and why the servers could not be read', () => {
    gql.servers.mockReturnValue({ data: { mcpServers: [] }, loading: false });
    const first = renderDashboard();
    expect(screen.getByText('No MCP server for you yet')).toBeInTheDocument();
    first.unmount();
    gql.servers.mockReturnValue({ data: undefined, loading: false, error: new Error('Down') });
    const second = renderDashboard();
    expect(screen.getByText('Down')).toBeInTheDocument();
    second.unmount();
    gql.servers.mockReturnValue({ data: undefined, loading: true });
    const third = renderDashboard();
    expect(third.container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    third.unmount();
    gql.servers.mockReturnValue({ data: undefined, loading: false });
    renderDashboard();
    expect(screen.queryByRole('heading', { name: 'CRM' })).not.toBeInTheDocument();
  });

  it('waits for usage, and says why it could not be read', () => {
    gql.usage.mockReturnValue({ data: undefined });
    const first = renderDashboard();
    expect(first.container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    first.unmount();
    gql.usage.mockReturnValue({ data: undefined, error: new Error('No usage') });
    renderDashboard();
    expect(screen.getByText('No usage')).toBeInTheDocument();
  });
});
