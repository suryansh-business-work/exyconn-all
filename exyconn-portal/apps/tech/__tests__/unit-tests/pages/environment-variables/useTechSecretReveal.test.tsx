import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TechSecret } from '@exyconn/shell/graphql/generated';
import { useTechSecretReveal } from '../../../../src/pages/environment-variables/useTechSecretReveal';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ reveal: vi.fn(), options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRevealTechSecretMutation: (options: unknown) => {
    gql.options(options);
    return [gql.reveal];
  },
}));

describe('useTechSecretReveal', () => {
  beforeEach(() => {
    gql.reveal.mockReset();
    gql.options.mockReset();
  });

  it('has no reveal on a new config, which has nothing saved', () => {
    const { result } = renderHookWithProviders(() => useTechSecretReveal(undefined));
    expect(result.current(TechSecret.GmailClientSecret)).toBeUndefined();
    expect(gql.reveal).not.toHaveBeenCalled();
  });

  it('fetches the saved value of the asked secret, bypassing the cache', async () => {
    gql.reveal.mockResolvedValue({ data: { revealTechSecret: 'stored-value' } });
    const { result } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    const reveal = result.current(TechSecret.GoogleMapsServerKey);
    await expect(reveal?.()).resolves.toBe('stored-value');
    expect(gql.reveal).toHaveBeenCalledWith({
      variables: { id: 'cfg-1', secret: TechSecret.GoogleMapsServerKey },
    });
    expect(gql.options).toHaveBeenCalledWith({ fetchPolicy: 'no-cache' });
  });

  it('reveals an empty value when the server answers without one', async () => {
    gql.reveal.mockResolvedValue({ data: undefined });
    const { result } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await expect(result.current(TechSecret.GmailClientSecret)?.()).resolves.toBe('');
  });

  it('passes a refused reveal on to the eye button', async () => {
    gql.reveal.mockRejectedValue(new Error('Not allowed'));
    const { result } = renderHookWithProviders(() => useTechSecretReveal('cfg-1'));
    await expect(result.current(TechSecret.GmailClientSecret)?.()).rejects.toThrow('Not allowed');
  });
});
