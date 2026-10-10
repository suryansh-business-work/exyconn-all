import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import {
  MyPendingApprovalCountDocument,
  type MyPendingApprovalCountQuery,
} from '@/graphql/generated';
import { makeSessionToken } from '../test-utils';
// Loaded once up front so each test's fresh import re-runs the module without transforming it again.
import '@/config/apolloClient';

vi.mock('@/logging/reportApolloError', () => ({ reportApolloError: vi.fn() }));
vi.mock('@/logging/portalLogger', () => ({ setLogTransport: vi.fn() }));

type FetchInit = { headers: Record<string, string>; body: string };

const fetchMock = vi.fn<(uri: string, init: FetchInit) => Promise<Response>>();

function answer(body: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }),
  );
}

/** A fresh client module, as a page opened at `url` builds it. */
async function load(url = '/') {
  globalThis.history.replaceState(null, '', url);
  vi.resetModules();
  const client = await import('@/config/apolloClient');
  const { tokenStore } = await import('@/auth/tokenStore');
  const { reportApolloError } = await import('@/logging/reportApolloError');
  const { setLogTransport } = await import('@/logging/portalLogger');
  const { networkActivity } = await import('@/config/networkActivity');
  return { ...client, tokenStore, reportApolloError, setLogTransport, networkActivity };
}

const ask = (client: Awaited<ReturnType<typeof load>>) =>
  client.apolloClient.query<MyPendingApprovalCountQuery>({
    query: MyPendingApprovalCountDocument,
    fetchPolicy: 'network-only',
  });

const sentHeaders = () => fetchMock.mock.calls[0][1].headers;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.history.replaceState(null, '', '/');
});

describe('apolloClient requests', () => {
  it('sends the session token and the company the address names', async () => {
    fetchMock.mockReturnValue(answer({ data: { myPendingApprovalCount: 3 } }));
    const client = await load('/organization/acme/hr');
    const token = makeSessionToken();
    client.tokenStore.set(token);

    const { data } = await ask(client);

    expect(data?.myPendingApprovalCount).toBe(3);
    expect(sentHeaders().authorization).toBe(`Bearer ${token}`);
    expect(sentHeaders()['x-organization']).toBe('acme');
  });

  it('sends neither header when signed out on an address with no company', async () => {
    fetchMock.mockReturnValue(answer({ data: { myPendingApprovalCount: 0 } }));
    const client = await load('/hr');
    await ask(client);
    expect(sentHeaders()).not.toHaveProperty('authorization');
    expect(sentHeaders()).not.toHaveProperty('x-organization');
  });

  it("adds an app's own headers to every request", async () => {
    fetchMock.mockReturnValue(answer({ data: { myPendingApprovalCount: 0 } }));
    const client = await load();
    client.setAppRequestHeaders(() => ({ 'x-demo-visitor': 'visitor-7' }));
    await ask(client);
    expect(sentHeaders()['x-demo-visitor']).toBe('visitor-7');
  });

  it('keeps the portal session out of an app that opts out of it', async () => {
    fetchMock.mockReturnValue(answer({ data: { myPendingApprovalCount: 0 } }));
    const client = await load();
    client.tokenStore.set(makeSessionToken());
    client.withoutPortalSession();
    await ask(client);
    expect(sentHeaders()).not.toHaveProperty('authorization');
  });

  it('counts a request on the activity bar while it is in flight', async () => {
    let release: (value: Response) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const client = await load();
    const pending = ask(client);
    await vi.waitFor(() => expect(client.networkActivity.getSnapshot()).toBe(1));
    release(await answer({ data: { myPendingApprovalCount: 1 } }));
    await pending;
    expect(client.networkActivity.getSnapshot()).toBe(0);
  });
});

describe('apolloClient errors', () => {
  const graphQLError = (code: string) =>
    answer({ data: null, errors: [{ message: code, extensions: { code } }] });

  it('signs the person out when the API says the session is gone', async () => {
    fetchMock.mockReturnValue(graphQLError('UNAUTHENTICATED'));
    const client = await load();
    client.tokenStore.set(makeSessionToken());

    await expect(ask(client)).rejects.toBeInstanceOf(CombinedGraphQLErrors);

    expect(client.tokenStore.get()).toBeNull();
    expect(client.reportApolloError).toHaveBeenCalledWith(
      expect.any(CombinedGraphQLErrors),
      'MyPendingApprovalCount',
    );
  });

  it('keeps the session on any other GraphQL error', async () => {
    fetchMock.mockReturnValue(graphQLError('FORBIDDEN'));
    const client = await load();
    const token = makeSessionToken();
    client.tokenStore.set(token);
    await expect(ask(client)).rejects.toThrow('FORBIDDEN');
    expect(client.tokenStore.get()).toBe(token);
  });

  it('leaves the shared session alone in an app that opted out of it', async () => {
    fetchMock.mockReturnValue(graphQLError('UNAUTHENTICATED'));
    const client = await load();
    const token = makeSessionToken();
    client.tokenStore.set(token);
    client.withoutPortalSession();
    await expect(ask(client)).rejects.toThrow('UNAUTHENTICATED');
    expect(client.tokenStore.get()).toBe(token);
  });

  it('reports a request that got no answer and keeps the session', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const client = await load();
    const token = makeSessionToken();
    client.tokenStore.set(token);
    await expect(ask(client)).rejects.toThrow('Failed to fetch');
    expect(client.reportApolloError).toHaveBeenCalledWith(
      expect.any(TypeError),
      'MyPendingApprovalCount',
    );
    expect(client.tokenStore.get()).toBe(token);
  });
});

describe('log transport', () => {
  it('sends a log batch as a background ReportClientLogs mutation', async () => {
    let release: (value: Response) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const client = await load();
    const transport = vi.mocked(client.setLogTransport).mock.calls[0][0];
    const batch = { entries: [] };

    const sent = transport(batch);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(client.networkActivity.getSnapshot()).toBe(0);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.operationName).toBe('ReportClientLogs');
    expect(body.variables).toEqual({ input: batch });

    release(await answer({ data: { reportClientLogs: true } }));
    await expect(sent).resolves.toMatchObject({ data: { reportClientLogs: true } });
  });
});
