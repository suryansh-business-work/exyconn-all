import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CallingBotSecret } from '@exyconn/shell/graphql/generated';
import { useSecretReveal } from '../../../../../../src/pages/demos/forms/calling-bot-config/useSecretReveal';

const api = vi.hoisted(() => ({ reveal: vi.fn(), options: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRevealCallingBotSecretMutation: (options: unknown) => {
    api.options = options;
    return [api.reveal];
  },
}));

beforeEach(() => {
  api.reveal.mockReset();
});

describe('useSecretReveal', () => {
  it('has nothing to reveal on a new config', () => {
    const { result } = renderHook(() => useSecretReveal(undefined));
    expect(result.current(CallingBotSecret.SarvamApiKey)).toBeUndefined();
  });

  it('fetches the saved key of the edited config, never from the cache', async () => {
    api.reveal.mockResolvedValue({ data: { revealCallingBotSecret: 'saved-key' } });
    const { result } = renderHook(() => useSecretReveal('cfg-1'));
    await expect(result.current(CallingBotSecret.OpenaiApiKey)?.()).resolves.toBe('saved-key');
    expect(api.reveal).toHaveBeenCalledWith({
      variables: { id: 'cfg-1', secret: CallingBotSecret.OpenaiApiKey },
    });
    expect(api.options).toEqual({ fetchPolicy: 'no-cache' });
  });

  it('answers empty when the server returns nothing', async () => {
    api.reveal.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useSecretReveal('cfg-1'));
    await expect(result.current(CallingBotSecret.TwilioAuthToken)?.()).resolves.toBe('');
  });
});
