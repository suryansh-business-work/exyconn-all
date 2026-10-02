import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { ApolloLink } from '@apollo/client';
import { Subject } from 'rxjs';
import { activityLink } from '@/config/networkActivity';
import { NetworkActivityBar } from '@/components/feedback/NetworkActivityBar';

/** Starts one counted request and hands back the means to answer it. */
function startRequest() {
  const server = new Subject<ApolloLink.Result>();
  const operation = { getContext: () => ({}) } as unknown as ApolloLink.Operation;
  activityLink.request(operation, () => server.asObservable())?.subscribe({});
  return server;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('NetworkActivityBar', () => {
  it('stays hidden for a request that answers at once', () => {
    render(<NetworkActivityBar />);
    let server = new Subject<ApolloLink.Result>();
    act(() => {
      server = startRequest();
    });
    act(() => server.complete());
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows while a slow request is in flight and goes once it settles', () => {
    render(<NetworkActivityBar />);
    let server = new Subject<ApolloLink.Result>();
    act(() => {
      server = startRequest();
    });
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    act(() => server.complete());
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
