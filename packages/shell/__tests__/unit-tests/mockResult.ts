import type { DocumentNode } from 'graphql';
import type { MockLink } from '@apollo/client/testing';

/** A mock answer plus a flag that flips once Apollo has actually delivered it. */
export interface TrackedMock {
  mock: MockLink.MockedResponse;
  delivered: () => boolean;
}

/**
 * One successful answer to `query`, delivered without the MockLink's random delay so a test
 * never races it. `delivered()` lets a test wait for an answer that renders nothing.
 */
export function answer(
  query: DocumentNode,
  data: Record<string, unknown>,
  variables?: Record<string, unknown>,
  maxUsageCount = 1,
): TrackedMock {
  let delivered = false;
  return {
    mock: {
      request: { query, variables },
      delay: 0,
      maxUsageCount,
      result: () => {
        delivered = true;
        return { data };
      },
    },
    delivered: () => delivered,
  };
}

/** A network failure for `query`. */
export function failure(
  query: DocumentNode,
  variables?: Record<string, unknown>,
  message = 'The network is down',
): MockLink.MockedResponse {
  return { request: { query, variables }, delay: 0, error: new Error(message) };
}
