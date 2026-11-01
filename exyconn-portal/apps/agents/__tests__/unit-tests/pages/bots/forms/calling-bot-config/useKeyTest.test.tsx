import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { CallingBotKey } from '@exyconn/shell/graphql/generated';
import { useKeyTest } from '../../../../../../src/pages/bots/forms/calling-bot-config/useKeyTest';

const api = vi.hoisted(() => ({ testKey: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTestCallingBotKeyMutation: () => [api.testKey],
}));

/** What the Test buttons send: every key and voice field, typed or blank. */
const TYPED_KEYS = {
  sarvamApiKey: 'typed-sarvam',
  languageCode: 'ta-IN',
  ttsModel: 'bulbul:v3',
  ttsSpeaker: 'shubh',
  openAiApiKey: '',
  openAiModel: 'gpt-4o-mini',
  vobizAuthId: 'MA1',
  vobizAuthToken: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
};
const TYPED = { ...TYPED_KEYS, label: 'Not sent' };

function FormWrapper({ children }: Readonly<{ children: ReactNode }>) {
  const methods = useForm({ defaultValues: TYPED });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

beforeEach(() => {
  api.testKey.mockReset();
});

describe('useKeyTest', () => {
  it('tests what is typed, with the edited config standing in for blank keys', async () => {
    api.testKey.mockResolvedValue({ data: { testCallingBotKey: 'Sarvam spoke in Tamil' } });
    const { result } = renderHook(() => useKeyTest('cfg-1'), { wrapper: FormWrapper });
    await expect(result.current(CallingBotKey.Sarvam)()).resolves.toBe('Sarvam spoke in Tamil');
    expect(api.testKey).toHaveBeenCalledWith({
      variables: { input: { configId: 'cfg-1', key: CallingBotKey.Sarvam, ...TYPED_KEYS } },
    });
  });

  it('works on a new config with nothing saved, answering empty when the server says nothing', async () => {
    api.testKey.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useKeyTest(undefined), { wrapper: FormWrapper });
    await expect(result.current(CallingBotKey.Openai)()).resolves.toBe('');
    expect(api.testKey.mock.calls[0][0].variables.input).toMatchObject({
      configId: undefined,
      key: CallingBotKey.Openai,
    });
  });

  it('passes on the provider’s refusal', async () => {
    api.testKey.mockRejectedValue(new Error('Invalid OpenAI key'));
    const { result } = renderHook(() => useKeyTest('cfg-1'), { wrapper: FormWrapper });
    await expect(result.current(CallingBotKey.Openai)()).rejects.toThrow('Invalid OpenAI key');
  });
});
