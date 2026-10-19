import { act, waitFor } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { describe, expect, it } from 'vitest';
import { CallingBotScenarioOptionsDocument } from '@exyconn/shell/graphql/generated';
import { useScenarioChoice } from '../../../src/call/useScenarioChoice';
import { renderHookWithProviders, useCurrentSearch } from '../test-utils';

const OPTIONS = [
  { __typename: 'CallingBotScenarioOption', id: 's1', title: 'Clinic', description: 'Book a visit', languageCode: 'en-IN' },
  { __typename: 'CallingBotScenarioOption', id: 's2', title: 'Bank', description: 'EMI reminder', languageCode: 'hi-IN' },
];
const served = {
  request: { query: CallingBotScenarioOptionsDocument },
  result: { data: { callingBotScenarioOptions: OPTIONS } },
};

function choose(route = '/', mocks: ReadonlyArray<MockLink.MockedResponse> = [served]) {
  return renderHookWithProviders(
    () => ({ choice: useScenarioChoice(), search: useCurrentSearch() }),
    { route, mocks },
  );
}

describe('the picked example call', () => {
  it('offers the enabled examples and reads the pick from the address', async () => {
    const { result } = choose('/?example=s2');
    await waitFor(() => {
      expect(result.current.choice.scenarios).toHaveLength(2);
    });
    expect(result.current.choice.selected?.title).toBe('Bank');
    expect(result.current.choice.failed).toBe(false);
  });

  it('picks nothing for an example that is no longer offered', async () => {
    const { result } = choose('/?example=gone');
    await waitFor(() => {
      expect(result.current.choice.scenarios).toHaveLength(2);
    });
    expect(result.current.choice.selected).toBeNull();
  });

  it('keeps the pick in the address, and clears it for the general assistant', async () => {
    const { result } = choose('/?lang=en');
    await waitFor(() => {
      expect(result.current.choice.scenarios).toHaveLength(2);
    });
    act(() => result.current.choice.select('s1'));
    expect(result.current.search).toBe('?lang=en&example=s1');
    expect(result.current.choice.selected?.id).toBe('s1');
    act(() => result.current.choice.select(''));
    expect(result.current.search).toBe('?lang=en');
  });

  it('reports examples that could not be loaded', async () => {
    const { result } = choose('/', [
      { request: { query: CallingBotScenarioOptionsDocument }, error: new Error('offline') },
    ]);
    await waitFor(() => {
      expect(result.current.choice.failed).toBe(true);
    });
    expect(result.current.choice.scenarios).toEqual([]);
  });
});
