import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatAgentsFields } from '../../../../../../src/pages/chat/forms/chat-settings/chat-agents.fields';
import { renderWithProviders } from '../../../../test-utils';
import { SettingsHarness } from './settings-harness';

const gql = vi.hoisted(() => ({ agents: vi.fn(), options: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatAgentCandidatesQuery: (options: unknown) => {
    gql.options = options;
    return gql.agents();
  },
}));

const AGENTS = [
  { id: 'agent-1', name: 'Asha Rao', email: 'asha@exyconn.com', online: true, openChats: 2 },
  { id: 'agent-2', name: 'Ravi K', email: 'ravi@exyconn.com', online: false, openChats: 0 },
];
const HINT =
  'Each new chat goes to the freest agent: online first, then the fewest open chats. Leave empty to keep chats unassigned for anyone to claim.';

function renderAgents(agentIds: string[] = [], onRead = vi.fn()) {
  renderWithProviders(
    <SettingsHarness agentIds={agentIds} onRead={onRead}>
      <ChatAgentsFields />
    </SettingsHarness>,
  );
  return onRead;
}

const picker = () => screen.getByRole('combobox', { name: 'Chat agents' });

describe('ChatAgentsFields', () => {
  beforeEach(() => {
    gql.agents.mockReset().mockReturnValue({
      data: { websiteChatAgentCandidates: AGENTS },
      loading: false,
      error: undefined,
    });
  });

  it('explains how chats are shared out, always asking for fresh candidates', () => {
    renderAgents();

    expect(screen.getByRole('heading', { name: 'Chat agents' })).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(gql.options).toEqual({ fetchPolicy: 'cache-and-network' });
  });

  it('shows the agents already chosen as chips', () => {
    renderAgents(['agent-2']);

    expect(screen.getByRole('button', { name: 'Ravi K' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Asha Rao' })).not.toBeInTheDocument();
  });

  it('lists each candidate with their email, whether they are online and how busy', async () => {
    renderAgents();
    await userEvent.click(picker());

    const [asha, ravi] = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(asha).toHaveTextContent('asha@exyconn.com');
    expect(asha).toHaveTextContent('2 open chats');
    expect(within(asha).getByRole('img', { name: 'Online' })).toBeInTheDocument();
    expect(within(ravi).getByRole('img', { name: 'Offline' })).toBeInTheDocument();
    expect(ravi).toHaveTextContent('0 open chats');
  });

  it('stores the ids of the agents picked and removed', async () => {
    const onRead = renderAgents(['agent-2']);
    await userEvent.click(picker());
    await userEvent.click(screen.getByRole('option', { name: /Asha Rao/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Read agents' }));
    expect(onRead).toHaveBeenLastCalledWith(['agent-2', 'agent-1']);

    const raviChip = screen.getByRole('button', { name: 'Ravi K' });
    await userEvent.click(within(raviChip).getByTestId('CancelIcon'));
    await userEvent.click(screen.getByRole('button', { name: 'Read agents' }));
    expect(onRead).toHaveBeenLastCalledWith(['agent-1']);
  });

  it('ignores saved ids of people who can no longer take chats', () => {
    renderAgents(['gone-agent']);
    expect(screen.queryByRole('button', { name: /Asha Rao|Ravi K/ })).not.toBeInTheDocument();
  });

  it('says when the candidates could not be loaded', () => {
    gql.agents.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Forbidden'),
    });
    renderAgents();

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(picker()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the schema’s complaint ahead of everything else', async () => {
    renderAgents();
    await userEvent.click(screen.getByRole('button', { name: 'Raise agents error' }));

    await waitFor(() => expect(screen.getByText('Choose at most 50 agents')).toBeInTheDocument());
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('shows that the list is still loading', async () => {
    gql.agents.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderAgents();
    await userEvent.click(picker());

    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });
});
