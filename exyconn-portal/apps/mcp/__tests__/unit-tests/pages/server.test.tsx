import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { McpServerPage } from '../../../src/pages/server';
import { McpConnectPage } from '../../../src/pages/connect';
import { McpConnectTab } from '../../../src/pages/server/McpConnectTab';
import { McpToolsTab } from '../../../src/pages/server/McpToolsTab';
import { McpUsageTab } from '../../../src/pages/server/McpUsageTab';
import { McpConnectionsTab } from '../../../src/pages/server/McpConnectionsTab';
import { renderWithProviders } from '../test-utils';

const gql = vi.hoisted(() => ({
  servers: vi.fn(),
  activity: vi.fn(),
  tools: vi.fn(),
  usage: vi.fn(),
  connections: vi.fn(),
  request: vi.fn(),
  approve: vi.fn(),
  deny: vi.fn(),
  revoke: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMcpServersQuery: gql.servers,
  useMcpActivityQuery: gql.activity,
  useMcpToolsQuery: gql.tools,
  useMcpUsageQuery: gql.usage,
  useMcpConnectionsQuery: gql.connections,
  useMcpAuthorizationRequestQuery: gql.request,
  useApproveMcpAuthorizationMutation: () => [gql.approve],
  useDenyMcpAuthorizationMutation: () => [gql.deny],
  useRevokeMcpConnectionMutation: () => [gql.revoke],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
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

const CRM_SERVER = {
  endpoint: McpEndpoint.Crm,
  label: 'CRM',
  description: 'Exyconn CRM: leads and deals.',
  serverUrl: 'https://portal-server.exyconn.com/mcp/crm',
  toolCount: 3,
  queryCount: 2,
  mutationCount: 1,
  connectionCount: 1,
};
const SERVERS = { data: { mcpServers: [CRM_SERVER] }, loading: false };

const TOOLS = {
  data: {
    mcpTools: [
      {
        server: McpEndpoint.Crm,
        name: 'searchLeads',
        kind: 'QUERY',
        description: 'Finds leads.\n\nCRM read',
        arguments: [{ name: 'input', type: 'CrmQueryInput!', required: true, description: '' }],
      },
      {
        server: McpEndpoint.Crm,
        name: 'deleteDeal',
        kind: 'MUTATION',
        description: 'Deletes a deal.',
        arguments: [],
      },
    ],
  },
  loading: false,
  refetch: vi.fn(),
};
const USAGE = {
  data: {
    mcpUsage: {
      calls: 5,
      failures: 1,
      people: 2,
      days: [{ day: '2026-10-24', calls: 5, failures: 1 }],
      tools: [{ tool: 'searchLeads', calls: 5, failures: 1, averageMs: 12.4 }],
      users: [{ userName: 'Asha', calls: 5 }],
    },
  },
  loading: false,
};

beforeEach(() => {
  for (const mock of Object.values(gql)) mock.mockReset();
  gql.servers.mockReturnValue(SERVERS);
  gql.activity.mockReturnValue({ data: { mcpActivity: [] }, loading: false, refetch: vi.fn() });
  gql.tools.mockReturnValue(TOOLS);
  gql.usage.mockReturnValue(USAGE);
  gql.connections.mockReturnValue({
    data: {
      mcpConnections: [
        {
          id: 'c1',
          endpoint: McpEndpoint.Crm,
          clientName: 'Claude',
          userName: 'Asha',
          createdAt: '2026-10-20T10:00:00Z',
          lastUsedAt: null,
        },
      ],
    },
    loading: false,
    refetch: vi.fn().mockResolvedValue({}),
  });
});

const PAGE = '/mcp/crm/:tab?';

describe('McpServerPage', () => {
  it('keeps connect, tools, usage, activity and connections on their own tabs', () => {
    renderWithProviders(<McpServerPage endpoint={McpEndpoint.Crm} />, {
      route: '/mcp/crm/setup',
      path: PAGE,
    });
    expect(screen.getByRole('heading', { name: 'CRM MCP server' })).toBeInTheDocument();
    for (const name of [
      'Connect',
      'Tools',
      'Usage & billing',
      'Claude (MCP) activity',
      'Connections',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });

  it('waits, says why the servers could not be read, and refuses a server out of reach', () => {
    gql.servers.mockReturnValue({ data: undefined, loading: true });
    const first = renderWithProviders(<McpServerPage endpoint={McpEndpoint.Crm} />, {
      route: '/mcp/crm',
      path: PAGE,
    });
    expect(first.container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    first.unmount();
    gql.servers.mockReturnValue({ data: undefined, loading: false, error: new Error('Down') });
    const second = renderWithProviders(<McpServerPage endpoint={McpEndpoint.Crm} />, {
      route: '/mcp/crm',
      path: PAGE,
    });
    expect(screen.getByText('Down')).toBeInTheDocument();
    second.unmount();
    gql.servers.mockReturnValue(SERVERS);
    renderWithProviders(<McpServerPage endpoint={McpEndpoint.Marketing} />, {
      route: '/mcp/marketing',
      path: '/mcp/marketing/:tab?',
    });
    expect(screen.getByText('You do not have access to this MCP server.')).toBeInTheDocument();
  });
});

describe('McpConnectTab', () => {
  it('shows the address to paste, copies it, and lists the steps', async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('no'));
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    renderWithProviders(<McpConnectTab endpoint={McpEndpoint.Crm} />);
    expect(
      screen.getByDisplayValue('https://portal-server.exyconn.com/mcp/crm'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/every CRM feature \(3 tools: 2 to read, 1 to change/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Name: Exyconn CRM\./)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Address copied', 'success'));
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith(
        'Could not copy. Select the address and copy it.',
        'error',
      ),
    );
    vi.unstubAllGlobals();
  });

  it('renders nothing for a server the person may not use', () => {
    const { container } = renderWithProviders(<McpConnectTab endpoint={McpEndpoint.Marketing} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('McpToolsTab', () => {
  it('lists every tool with its arguments and finds one by name', async () => {
    renderWithProviders(<McpToolsTab endpoint={McpEndpoint.Crm} />);
    const row = screen.getByText('searchLeads').closest('tr') as HTMLElement;
    expect(within(row).getByText('input*: CrmQueryInput!')).toBeInTheDocument();
    expect(within(row).getByText('Finds leads.')).toBeInTheDocument();
    expect(screen.getByText('deleteDeal').closest('tr')).toHaveTextContent('—');
    await userEvent.type(screen.getByLabelText('Search tools'), 'deal');
    expect(screen.queryByText('searchLeads')).not.toBeInTheDocument();
  });

  it('says why the tools could not be read, and copes with none', () => {
    gql.tools.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    const { unmount } = renderWithProviders(<McpToolsTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();
    gql.tools.mockReturnValue({ data: undefined, loading: false, refetch: vi.fn() });
    renderWithProviders(<McpToolsTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('No tool matches.')).toBeInTheDocument();
  });
});

describe('McpUsageTab', () => {
  it('shows calls, failures and people, by day, person and tool, over the period picked', async () => {
    renderWithProviders(<McpUsageTab endpoint={McpEndpoint.Crm} />);
    expect(gql.usage).toHaveBeenCalledWith({
      variables: { endpoint: McpEndpoint.Crm, days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Calls per day: 5')).toBeInTheDocument();
    expect(screen.getByText('Calls by person: Asha')).toBeInTheDocument();
    expect(screen.getByText('searchLeads').closest('tr')).toHaveTextContent('12');
    expect(screen.getByText(/Calls through MCP are not billed/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Period' }));
    await userEvent.click(screen.getByRole('option', { name: 'Last 7 days' }));
    expect(gql.usage).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { endpoint: McpEndpoint.Crm, days: 7 } }),
    );
  });

  it('waits, says why usage could not be read, and shows nothing before an answer', () => {
    gql.usage.mockReturnValue({ data: undefined, loading: true });
    const first = renderWithProviders(<McpUsageTab endpoint={McpEndpoint.Crm} />);
    expect(first.container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    first.unmount();
    gql.usage.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    const second = renderWithProviders(<McpUsageTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    second.unmount();
    gql.usage.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<McpUsageTab endpoint={McpEndpoint.Crm} />);
    expect(screen.queryByText(/Calls per day/)).not.toBeInTheDocument();
  });
});

describe('McpConnectionsTab', () => {
  const confirmIn = async (name: string) => {
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  };

  it('signs a connection out once confirmed, and keeps it on cancel', async () => {
    gql.revoke.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Gone'));
    renderWithProviders(<McpConnectionsTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('Asha').closest('tr')).toHaveTextContent('—');
    const signOut = () =>
      userEvent.click(screen.getByRole('button', { name: 'Sign this connection out' }));
    await signOut();
    await confirmIn('Cancel');
    expect(gql.revoke).not.toHaveBeenCalled();
    await signOut();
    await confirmIn('Sign out');
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Connection signed out', 'success'),
    );
    expect(gql.revoke).toHaveBeenCalledWith({
      variables: { id: 'c1' },
      refetchQueries: ['McpServers'],
    });
    await signOut();
    await confirmIn('Sign out');
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Gone', 'error'));
  });

  it('shows when it was last used, and says why connections could not be read', () => {
    gql.connections.mockReturnValue({
      data: {
        mcpConnections: [
          {
            id: 'c2',
            endpoint: McpEndpoint.All,
            clientName: 'Claude',
            userName: 'Ravi',
            createdAt: '2026-10-20T10:00:00Z',
            lastUsedAt: '2026-10-24T10:00:00Z',
          },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    });
    const { unmount } = renderWithProviders(<McpConnectionsTab endpoint={McpEndpoint.All} />);
    expect(screen.getByText('Ravi').closest('tr')).not.toHaveTextContent('—');
    expect(screen.getByRole('columnheader', { name: 'Server' })).toBeInTheDocument();
    expect(screen.getByText('Ravi').closest('tr')).toHaveTextContent('ALL');
    unmount();
    gql.connections.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Forbidden'),
    });
    renderWithProviders(<McpConnectionsTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });
});

describe('McpConnectPage', () => {
  const REQUEST = {
    data: {
      mcpAuthorizationRequest: {
        id: 'r1',
        endpoint: McpEndpoint.Crm,
        serverLabel: 'CRM',
        clientName: 'Claude',
        redirectHost: 'claude.ai',
        scopes: ['crm'],
      },
    },
    loading: false,
  };
  const renderAt = (search = '?request=r1') =>
    renderWithProviders(<McpConnectPage />, { route: `/mcp/connect${search}` });

  it('sends the browser back to Claude once allowed or declined', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    gql.request.mockReturnValue(REQUEST);
    gql.approve.mockResolvedValue({
      data: { approveMcpAuthorization: 'https://claude.ai/cb?code=1' },
    });
    gql.deny.mockResolvedValue({
      data: { denyMcpAuthorization: 'https://claude.ai/cb?error=access_denied' },
    });
    renderAt();
    expect(screen.getByRole('heading', { name: 'Claude wants to use CRM' })).toBeInTheDocument();
    expect(screen.getByText(/goes back to claude\.ai/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(gql.approve).toHaveBeenCalledWith({ variables: { id: 'r1' } });
    expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?code=1');
    vi.unstubAllGlobals();
  });

  it('declines, and reports an answer the server refuses', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    gql.request.mockReturnValue(REQUEST);
    gql.deny.mockResolvedValueOnce({
      data: { denyMcpAuthorization: 'https://claude.ai/cb?error=x' },
    });
    gql.approve
      .mockRejectedValueOnce(new Error('Expired'))
      .mockResolvedValueOnce({ data: undefined });
    renderAt();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?error=x');
    cleanup();
    renderAt();
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Expired', 'error'));
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(assign).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('explains an incomplete link, a refused request, and waits while it loads', () => {
    gql.request.mockReturnValue({ data: undefined, loading: false });
    const first = renderAt('');
    expect(
      screen.getByText('This sign-in link is incomplete. Start again from Claude.'),
    ).toBeInTheDocument();
    expect(gql.request).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    first.unmount();
    gql.request.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Sign-in request not found'),
    });
    const second = renderAt();
    expect(screen.getByText('Sign-in request not found')).toBeInTheDocument();
    second.unmount();
    gql.request.mockReturnValue({ data: undefined, loading: true });
    const third = renderAt();
    expect(third.container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    third.unmount();
    gql.request.mockReturnValue({ data: undefined, loading: false });
    renderAt();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
  });
});
