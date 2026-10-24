import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TechSecret } from '@exyconn/shell/graphql/generated';
import { useTechSecretReveal } from '../../../../src/pages/environment-variables/useTechSecretReveal';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ revealAll: vi.fn(), options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRevealAllTechSecretsMutation: (options: unknown) => {
    gql.options(options);
    return [gql.revealAll];
  },
}));

const SAVED = {
  data: {
    revealAllTechSecrets: [
      { secret: TechSecret.GoogleMapsServerKey, id: 'cfg-1', value: 'server-key' },
      { secret: TechSecret.GmailClientSecret, id: 'cfg-2', value: 'gmail-secret' },
    ],
  },
};

describe('useTechSecretReveal', () => {
  beforeEach(() => {
    gql.revealAll.mockReset().mockResolvedValue(SAVED);
    gql.options.mockReset();
  });

  it('has no reveal on a new config, which has nothing saved', () => {
    const { result } = renderHookWithProviders(() => useTechSecretReveal(undefined));
    expect(result.current(TechSecret.GmailClientSecret)).toBeUndefined();
    expect(gql.revealAll).not.toHaveBeenCalled();
  });

  it('loads every saved value once, bypassing the cache, then answers from memory', async () => {
    const { result } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await expect(result.current(TechSecret.GoogleMapsServerKey)?.()).resolves.toBe('server-key');
    await expect(result.current(TechSecret.GmailClientSecret)?.()).resolves.toBe('');
    expect(gql.revealAll).toHaveBeenCalledTimes(1);
    expect(gql.options).toHaveBeenCalledWith({ fetchPolicy: 'no-cache' });
  });

  it('reads the values again once the form closes, so a key just saved shows', async () => {
    const { result, unmount } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await result.current(TechSecret.GoogleMapsServerKey)?.();
    unmount();
    const reopened = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await reopened.result.current(TechSecret.GoogleMapsServerKey)?.();
    expect(gql.revealAll).toHaveBeenCalledTimes(2);
  });

  it('answers empty when the server sends nothing, and retries after a refusal', async () => {
    gql.revealAll
      .mockRejectedValueOnce(new Error('Not allowed'))
      .mockResolvedValueOnce({ data: undefined });
    const { result } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await expect(result.current(TechSecret.GmailClientSecret)?.()).rejects.toThrow('Not allowed');
    await expect(result.current(TechSecret.GmailClientSecret)?.()).resolves.toBe('');
  });

  it('refuses to run outside the Environment Variables page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTechSecretReveal('cfg-1'))).toThrow(
      'useTechSecrets is used outside TechSecretsProvider',
    );
  });
});
