import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

/** The real client talks to the API; nothing on these stand-in pages queries it. */
vi.mock('@exyconn/shell/config/apolloClient', async () => {
  const { ApolloClient, ApolloLink, InMemoryCache } = await import('@apollo/client');
  return {
    apolloClient: new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() }),
  };
});
vi.mock('../../src/components/StatusShell', () => ({
  StatusShell: ({ children }: Readonly<{ children: ReactNode }>) => <main>{children}</main>,
}));
vi.mock('../../src/pages/status', () => ({ StatusPage: () => <p>Status page</p> }));
vi.mock('../../src/pages/report', () => ({ ReportPage: () => <p>Report page</p> }));
vi.mock('../../src/pages/help', () => ({ HelpPage: () => <p>Help page</p> }));
vi.mock('../../src/pages/subscribe', () => ({
  ConfirmSubscriptionPage: () => <p>Confirm page</p>,
  UnsubscribePage: () => <p>Unsubscribe page</p>,
}));
vi.mock('../../src/pages/sign', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    SignContractPage: function SignStub() {
      return <p>{`Sign page ${useParams().token ?? ''}`}</p>;
    },
  };
});
vi.mock('../../src/pages/project', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    SharedProjectPage: function ProjectStub() {
      return <p>{`Project page ${useParams().token ?? ''}`}</p>;
    },
  };
});

function renderAt(path: string) {
  globalThis.history.pushState({}, '', path);
  render(<App />);
}

afterEach(() => {
  globalThis.history.pushState({}, '', '/');
});

describe('App', () => {
  it.each([
    ['/', 'Status page'],
    ['/report', 'Report page'],
    ['/help', 'Help page'],
    ['/subscribe/confirm?token=abc', 'Confirm page'],
    ['/unsubscribe?token=abc', 'Unsubscribe page'],
    ['/sign/contract-token', 'Sign page contract-token'],
    ['/project/share-token', 'Project page share-token'],
  ])('renders the page for %s inside the status frame', async (path, text) => {
    renderAt(path);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByText(text));
  });

  it('sends any other address back to the status page', async () => {
    renderAt('/no-such-page');
    expect(await screen.findByText('Status page')).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe('/');
  });
});
