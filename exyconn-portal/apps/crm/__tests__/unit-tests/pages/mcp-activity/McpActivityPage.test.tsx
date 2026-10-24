import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpActivityPage } from '../../../../src/pages/mcp-activity';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ activity: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMcpActivityQuery: gql.activity,
}));

const row = (id: string, ok: boolean, error = '') => ({
  id,
  at: '2026-10-24T10:00:00Z',
  userName: 'Asha',
  clientName: 'Claude',
  tool: ok ? 'searchLeads' : 'deleteDeal',
  kind: ok ? 'QUERY' : 'MUTATION',
  ok,
  error,
  durationMs: 42,
});

describe('McpActivityPage', () => {
  beforeEach(() => {
    gql.activity.mockReset().mockReturnValue({
      data: { mcpActivity: [row('1', true), row('2', false, 'Not allowed')] },
      loading: false,
      refetch: vi.fn(),
    });
  });

  it('lists what Claude did, for whom, and how it went', async () => {
    renderWithProviders(<McpActivityPage />);
    expect(gql.activity).toHaveBeenCalledWith({
      variables: { days: 7, limit: 300 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('searchLeads').closest('tr')).toHaveTextContent('DONE');
    expect(screen.getByText('deleteDeal').closest('tr')).toHaveTextContent('Not allowed');
    await userEvent.click(screen.getByRole('combobox', { name: 'Period' }));
    await userEvent.click(screen.getByRole('option', { name: 'Last 30 days' }));
    expect(gql.activity).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { days: 30, limit: 300 } }),
    );
  });

  it('opens the AI portal to connect Claude, and says why activity could not be read', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    renderWithProviders(<McpActivityPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect Claude' }));
    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/\/ai\/mcp\/setup$/));
    vi.unstubAllGlobals();
    gql.activity.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Forbidden'),
    });
    renderWithProviders(<McpActivityPage />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('copes with no answer yet', () => {
    gql.activity.mockReturnValue({ data: undefined, loading: false, refetch: vi.fn() });
    renderWithProviders(<McpActivityPage />);
    expect(
      screen.getByText('Claude has not done anything in the CRM in this period.'),
    ).toBeInTheDocument();
  });
});
