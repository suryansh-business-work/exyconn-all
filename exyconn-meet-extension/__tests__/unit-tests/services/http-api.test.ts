import { describe, expect, it, vi } from 'vitest';
import { MaExtensionContextDocument } from '../../../src/graphql/generated';
import { createGraphqlClient, type GraphqlClientOptions } from '../../../src/services/api';
import { ApiError, fetchWithTimeout, readJson } from '../../../src/services/http';
import { jsonResponse } from '../chrome-mock';

const ok = { data: { maExtensionContext: { userId: 'u1' } } };
const unauthenticated = {
  errors: [{ message: 'Not signed in', extensions: { code: 'UNAUTHENTICATED' } }],
};

function client(overrides: Partial<GraphqlClientOptions>, ...responses: Response[]) {
  const fetchImpl = vi.fn<GraphqlClientOptions['fetchImpl']>();
  for (const response of responses) {
    fetchImpl.mockResolvedValueOnce(response);
  }
  const options: GraphqlClientOptions = {
    apiUrl: 'https://api.test',
    fetchImpl,
    getAccessToken: vi.fn(() => Promise.resolve('access-1')),
    refreshAccessToken: vi.fn(() => Promise.resolve('access-2')),
    onSignedOut: vi.fn(() => Promise.resolve(undefined)),
    ...overrides,
  };
  return { api: createGraphqlClient(options), fetchImpl, options };
}

describe('fetchWithTimeout', () => {
  it('turns a timeout and a network failure into ApiErrors', async () => {
    const timeout = vi.fn(() => Promise.reject(new DOMException('slow', 'TimeoutError')));
    await expect(fetchWithTimeout(timeout, 'u', {})).rejects.toMatchObject({ code: 'TIMEOUT' });
    const offline = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(fetchWithTimeout(offline, 'u', {}, 5)).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('passes an abort signal along', async () => {
    const fetchImpl = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(jsonResponse(200, {})),
    );
    await fetchWithTimeout(fetchImpl, 'u', { method: 'POST' });
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      signal: expect.any(AbortSignal),
    });
  });

  it('reads JSON or nothing', async () => {
    await expect(readJson(jsonResponse(200, { a: 1 }))).resolves.toEqual({ a: 1 });
    await expect(readJson(jsonResponse(200, 'not json'))).resolves.toBeNull();
  });
});

describe('GraphQL client', () => {
  it('posts the query with the bearer token and returns data', async () => {
    const { api, fetchImpl } = client({}, jsonResponse(200, ok));
    await expect(api.request(MaExtensionContextDocument, {})).resolves.toEqual(ok.data);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.test/graphql');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer access-1' });
    expect(JSON.parse(String(init.body))).toMatchObject({
      query: expect.stringContaining('maExtensionContext'),
      variables: {},
    });
  });

  it('refreshes once on UNAUTHENTICATED and retries with the new token', async () => {
    const { api, fetchImpl, options } = client(
      {},
      jsonResponse(200, unauthenticated),
      jsonResponse(200, ok),
    );
    await expect(api.request(MaExtensionContextDocument, {})).resolves.toEqual(ok.data);
    expect(options.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({ Authorization: 'Bearer access-2' });
  });

  it('signs out when the refresh fails', async () => {
    const { api, options } = client(
      { refreshAccessToken: vi.fn(() => Promise.resolve(null)) },
      jsonResponse(401, {}),
    );
    await expect(api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(options.onSignedOut).toHaveBeenCalled();
  });

  it('signs out when the retried request is still refused', async () => {
    const { api, options } = client({}, jsonResponse(401, {}), jsonResponse(401, {}));
    await expect(api.request(MaExtensionContextDocument, {})).rejects.toBeInstanceOf(ApiError);
    expect(options.onSignedOut).toHaveBeenCalledTimes(1);
  });

  it('refuses to send a private request while signed out', async () => {
    const { api, fetchImpl } = client({ getAccessToken: vi.fn(() => Promise.resolve(null)) });
    await expect(api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends a public request without a token when signed out', async () => {
    const { api, fetchImpl } = client(
      { getAccessToken: vi.fn(() => Promise.resolve(null)) },
      jsonResponse(200, ok),
    );
    await api.request(MaExtensionContextDocument, {}, { allowAnonymous: true });
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('reports GraphQL, HTTP and empty answers as errors', async () => {
    const graphql = client(
      {},
      jsonResponse(200, { errors: [{ message: 'Nope', extensions: { code: 'FORBIDDEN' } }] }),
    );
    await expect(graphql.api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Nope',
    });
    const bare = client({}, jsonResponse(200, { errors: [{}] }));
    await expect(bare.api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'GRAPHQL_ERROR',
      message: 'The request failed',
    });
    const http = client({}, jsonResponse(500, 'oops'));
    await expect(http.api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 500,
    });
    const empty = client({}, jsonResponse(200, { data: null }));
    await expect(empty.api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'NO_DATA',
    });
    const odd = client(
      {},
      jsonResponse(200, { errors: [{ message: 'x', extensions: { code: 5 } }] }),
    );
    await expect(odd.api.request(MaExtensionContextDocument, {})).rejects.toMatchObject({
      code: 'GRAPHQL_ERROR',
    });
  });
});
