import { afterEach, describe, expect, it, vi } from 'vitest';

const { createPortalClient, getToken } = vi.hoisted(() => ({
  createPortalClient: vi.fn((_options: { url: string; getToken: () => string | null }) => ({
    login: vi.fn(),
    trackerMe: vi.fn(),
    reportClientLogs: vi.fn(),
  })),
  getToken: vi.fn(() => 'device-token'),
}));

vi.mock('@exyconn/tracker-core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/tracker-core')>()),
  createPortalClient,
}));
vi.mock('../../../src/main/store', () => ({ secureStore: () => ({ getToken }) }));

/** The endpoint is read once, at import, so each case loads the module afresh. */
async function load() {
  vi.resetModules();
  createPortalClient.mockClear();
  return import('../../../src/main/portal-client');
}

/** Stubbed first so `unstubAllEnvs` puts back whatever the runner had. */
function clearExplicitEndpoint(): void {
  vi.stubEnv('PORTAL_GRAPHQL_URL', '');
  delete process.env.PORTAL_GRAPHQL_URL;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('PORTAL_GRAPHQL_URL', () => {
  it('talks to the real portal from an installed build', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    clearExplicitEndpoint();

    const { PORTAL_GRAPHQL_URL } = await load();

    expect(PORTAL_GRAPHQL_URL).toBe('https://portal-server.exyconn.com/graphql');
  });

  it('talks to the local portal under the dev server', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:4005');
    clearExplicitEndpoint();

    const { PORTAL_GRAPHQL_URL } = await load();

    expect(PORTAL_GRAPHQL_URL).toBe('http://localhost:4004/graphql');
  });

  it('lets an explicit endpoint win, for pointing a dev build at staging', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:4005');
    vi.stubEnv('PORTAL_GRAPHQL_URL', 'https://staging.example/graphql');

    const { PORTAL_GRAPHQL_URL } = await load();

    expect(PORTAL_GRAPHQL_URL).toBe('https://staging.example/graphql');
  });
});

describe('the shared portal client', () => {
  it('is built for that endpoint, reads the device token from the store, and is re-exported', async () => {
    vi.stubEnv('PORTAL_GRAPHQL_URL', 'https://staging.example/graphql');

    const portal = await load();

    expect(createPortalClient).toHaveBeenCalledTimes(1);
    const [options] = createPortalClient.mock.calls[0];
    expect(options.url).toBe('https://staging.example/graphql');
    expect(options.getToken()).toBe('device-token');
    expect(getToken).toHaveBeenCalled();

    const client = createPortalClient.mock.results[0].value;
    expect(portal.login).toBe(client.login);
    expect(portal.trackerMe).toBe(client.trackerMe);
    expect(portal.reportClientLogs).toBe(client.reportClientLogs);
  });
});
