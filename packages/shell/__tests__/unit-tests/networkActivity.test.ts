import { describe, expect, it } from 'vitest';
import type { ApolloLink } from '@apollo/client';
import { Subject } from 'rxjs';
import { activityLink, BACKGROUND_REQUEST, networkActivity } from '@/config/networkActivity';

/** Runs one request through the link against a server we answer by hand. */
function send(context: Record<string, unknown> = {}) {
  const server = new Subject<ApolloLink.Result>();
  const operation = { getContext: () => context } as unknown as ApolloLink.Operation;
  const result = activityLink.request(operation, () => server.asObservable());
  if (!result) {
    throw new Error('activityLink must forward every request');
  }
  return { server, result };
}

describe('activityLink', () => {
  it('counts a request from the moment it is sent until it is answered', () => {
    const { server, result } = send();
    expect(networkActivity.getSnapshot()).toBe(0);
    result.subscribe({});
    expect(networkActivity.getSnapshot()).toBe(1);
    server.next({ data: {} });
    server.complete();
    expect(networkActivity.getSnapshot()).toBe(0);
  });

  it('stops counting a request that fails or is cancelled', () => {
    const failed = send();
    const cancelled = send();
    failed.result.subscribe({ error: () => undefined });
    const subscription = cancelled.result.subscribe({});
    expect(networkActivity.getSnapshot()).toBe(2);
    failed.server.error(new Error('Failed to fetch'));
    subscription.unsubscribe();
    expect(networkActivity.getSnapshot()).toBe(0);
  });

  it('leaves a background request off the count', () => {
    const { result } = send(BACKGROUND_REQUEST);
    const subscription = result.subscribe({});
    expect(networkActivity.getSnapshot()).toBe(0);
    subscription.unsubscribe();
  });

  it('tells subscribers when the count changes', () => {
    const counts: number[] = [];
    const stop = networkActivity.subscribe(() => counts.push(networkActivity.getSnapshot()));
    const { server, result } = send();
    result.subscribe({});
    server.complete();
    stop();
    expect(counts).toEqual([1, 0]);
  });
});
