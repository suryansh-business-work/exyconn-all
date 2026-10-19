import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useApolloClient } from '@apollo/client/react';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { App } from '../../src/App';

const shared = vi.hoisted(() => ({ client: null as unknown, seen: null as unknown }));

vi.mock('@exyconn/shell/config/apolloClient', async () => {
  const { ApolloClient, ApolloLink, InMemoryCache } = await import('@apollo/client');
  shared.client = new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() });
  return { apolloClient: shared.client };
});
vi.mock('../../src/HubPage', () => ({
  HubPage: function HubPage() {
    shared.seen = useApolloClient();
    const { mode } = useColorMode();
    return <p>{`Hub page in ${mode} mode`}</p>;
  },
}));

describe('App', () => {
  it('shows the hub page with the shared Apollo client and a colour mode, no sign-in', () => {
    render(<App />);
    expect(screen.getByText(/^Hub page in (light|dark) mode$/)).toBeInTheDocument();
    expect(shared.seen).toBe(shared.client);
  });
});
