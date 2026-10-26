import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { McpActivityTab } from '../../../src/pages/server/McpActivityTab';
import { renderWithProviders } from '../test-utils';

const gql = vi.hoisted(() => ({ activity: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMcpActivityQuery: gql.activity,
}));

const row = (id: string, ok: boolean, error = '') => ({
  id,
  server: ok ? McpEndpoint.Crm : McpEndpoint.Marketing,
  at: '2026-10-24T10:00:00Z',
  userName: 'Asha',
  clientName: 'Claude',
  tool: ok ? 'searchLeads' : 'deleteCampaign',
  kind: ok ? 'QUERY' : 'MUTATION',
  ok,
  error,
  durationMs: 42,
});

describe('McpActivityTab', () => {
  beforeEach(() => {
    gql.activity.mockReset().mockReturnValue({
      data: { mcpActivity: [row('1', true), row('2', false, 'Not allowed')] },
      loading: false,
      refetch: vi.fn(),
    });
  });

  it('lists what Claude did through one server, for whom, and how it went', async () => {
    renderWithProviders(<McpActivityTab endpoint={McpEndpoint.Crm} />);
    expect(gql.activity).toHaveBeenCalledWith({
      variables: { endpoint: McpEndpoint.Crm, days: 7, limit: 300 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('searchLeads').closest('tr')).toHaveTextContent('DONE');
    expect(screen.getByText('deleteCampaign').closest('tr')).toHaveTextContent('Not allowed');
    expect(screen.queryByRole('columnheader', { name: 'Module' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Period' }));
    await userEvent.click(screen.getByRole('option', { name: 'Last 30 days' }));
    expect(gql.activity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: { endpoint: McpEndpoint.Crm, days: 30, limit: 300 },
      }),
    );
  });

  it('names each call’s module on the global server', () => {
    renderWithProviders(<McpActivityTab endpoint={McpEndpoint.All} />);
    expect(screen.getByRole('columnheader', { name: 'Module' })).toBeInTheDocument();
    expect(screen.getByText('deleteCampaign').closest('tr')).toHaveTextContent('MARKETING');
  });

  it('says why activity could not be read, and copes with no answer yet', () => {
    gql.activity.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Forbidden'),
    });
    const { unmount } = renderWithProviders(<McpActivityTab endpoint={McpEndpoint.Crm} />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();
    gql.activity.mockReturnValue({ data: undefined, loading: false, refetch: vi.fn() });
    renderWithProviders(<McpActivityTab endpoint={McpEndpoint.Crm} />);
    expect(
      screen.getByText('Claude has not done anything through this server in this period.'),
    ).toBeInTheDocument();
  });
});
