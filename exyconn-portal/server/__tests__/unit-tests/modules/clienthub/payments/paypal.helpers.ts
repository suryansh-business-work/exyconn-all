import type { PaypalKeys } from '../../../../../src/modules/clienthub/payments/paypal.client';

export const TOKEN_URL = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
let keyCount = 0;

/** Fresh keys per test, so the client's token cache never carries over between tests. */
export const freshKeys = (mode: PaypalKeys['mode'] = 'SANDBOX'): PaypalKeys => {
  keyCount += 1;
  return { clientId: `client-${keyCount}`, clientSecret: `cs_${'s'.repeat(20)}`, mode };
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

export const token = (expiresIn?: number) =>
  json({ access_token: 'access-1', expires_in: expiresIn });

/**
 * Replaces fetch for the suite: each test queues the answers it expects, in order, and any
 * call beyond them fails — a test never reaches the real network.
 */
export function useQueuedFetch() {
  let spy: jest.SpyInstance | undefined;
  beforeEach(() => {
    spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Unexpected fetch');
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const mock = (): jest.SpyInstance => {
    if (!spy) {
      throw new Error('useQueuedFetch is only usable inside a test');
    }
    return spy;
  };
  return {
    mock,
    queue: (...responses: Response[]) => {
      for (const response of responses) {
        mock().mockImplementationOnce(async () => response);
      }
    },
  };
}
