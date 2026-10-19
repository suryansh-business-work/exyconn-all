import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { LeadEmailStatus } from '@exyconn/shell/graphql/generated';
import { emailsOf, useLeadEmails } from '../../../../src/pages/lead-generator/useLeadEmails';
import { renderHookWithProviders } from '../../test-utils';
import { foundLookup, leadPlace, missLookup } from './lead-fixtures';

const gql = vi.hoisted(() => ({ findEmails: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useFindLeadEmailsMutation: () => [gql.findEmails],
}));

const site = (placeId: string) => leadPlace({ placeId, website: `https://${placeId}.example` });

describe('useLeadEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads each chosen website once and stores what it found', async () => {
    gql.findEmails.mockImplementation(({ variables }: { variables: { website: string } }) =>
      Promise.resolve({ data: { findLeadEmails: foundLookup([`hi@${variables.website}`]) } }),
    );
    const { result } = renderHookWithProviders(() => useLeadEmails());

    await act(() =>
      result.current.run([site('a'), site('b'), leadPlace({ placeId: 'c', website: '' })]),
    );

    expect(gql.findEmails).toHaveBeenCalledTimes(2);
    expect(result.current.lookups).toEqual({
      a: foundLookup(['hi@https://a.example']),
      b: foundLookup(['hi@https://b.example']),
    });
    expect(result.current.running).toBe(false);

    await act(() => result.current.run([site('a')]));
    expect(gql.findEmails).toHaveBeenCalledTimes(2);
  });

  it('shows a place as being read until its lookup answers', async () => {
    let answer: (value: unknown) => void = () => undefined;
    gql.findEmails.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const { result } = renderHookWithProviders(() => useLeadEmails());

    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.run([site('a')]);
    });
    await waitFor(() => expect(result.current.running).toBe(true));
    expect(result.current.lookups.a).toEqual({ status: 'PENDING' });

    await act(async () => {
      answer({ data: { findLeadEmails: missLookup('No address published') } });
      await done;
    });
    expect(result.current.running).toBe(false);
    expect(result.current.lookups.a).toEqual(missLookup('No address published'));
  });

  it('marks a website unreachable with the error when the lookup fails', async () => {
    gql.findEmails
      .mockRejectedValueOnce(new Error('Timed out'))
      .mockRejectedValueOnce('socket closed');
    const { result } = renderHookWithProviders(() => useLeadEmails());

    await act(() => result.current.run([site('a'), site('b')]));

    expect(result.current.lookups).toEqual({
      a: missLookup('Timed out', LeadEmailStatus.Unreachable),
      b: missLookup('Could not read the website', LeadEmailStatus.Unreachable),
    });
  });

  it('marks a website unreachable instead of reading forever when the lookup returns no data', async () => {
    gql.findEmails.mockResolvedValue({ data: undefined });
    const { result } = renderHookWithProviders(() => useLeadEmails());

    await act(() => result.current.run([site('a')]));

    expect(result.current.running).toBe(false);
    expect(result.current.lookups.a).toEqual(
      missLookup('The website lookup returned no data', LeadEmailStatus.Unreachable),
    );
  });
});

describe('emailsOf', () => {
  it('returns the addresses of a finished lookup, and none otherwise', () => {
    expect(emailsOf(foundLookup(['a@b.example']))).toEqual(['a@b.example']);
    expect(emailsOf({ status: 'PENDING' })).toEqual([]);
    expect(emailsOf(undefined)).toEqual([]);
  });
});
