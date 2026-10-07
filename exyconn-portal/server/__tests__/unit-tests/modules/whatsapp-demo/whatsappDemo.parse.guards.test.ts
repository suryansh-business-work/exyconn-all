import { randomUUID } from 'node:crypto';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';
import { aiStatus, parseAs } from '../../../../src/modules/whatsapp-demo/whatsappDemo.parse';
import { WhatsappDemoSessionModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';
import { actor, configure, input, recordedCall } from './parseFixtures';

const mockAllow = jest.fn<Promise<boolean>, [string]>();

jest.mock('../../../../src/lib/rateLimiter', () => ({
  createLimiter: () => ({ allow: (key: string) => mockAllow(key) }),
}));

const complete = jest
  .spyOn(openAiClient, 'complete')
  .mockRejectedValue(new Error('unexpected OpenAI call'));

beforeEach(() => {
  mockAllow.mockResolvedValue(true);
});

describe('whether the AI parse is available', () => {
  it('is not configured without an active OpenAI config', async () => {
    await OpenAiConfigModel.create({
      label: 'Old',
      apiKey: randomUUID(),
      defaultModel: 'gpt-4',
      isActive: false,
    });
    await expect(aiStatus()).resolves.toEqual({ configured: false, model: null });
  });

  it('names the model of the active config', async () => {
    await configure();
    await expect(aiStatus()).resolves.toEqual({ configured: true, model: 'gpt-4o-mini' });
  });
});

describe('the guards around the AI parse', () => {
  it('says it is not configured, and records that outcome', async () => {
    const result = await parseAs(actor, input);
    expect(result).toEqual({
      ok: false,
      intent: null,
      entities: {},
      latencyMs: 0,
      error: 'NOT_CONFIGURED',
    });
    expect(complete).not.toHaveBeenCalled();
    const call = await recordedCall();
    expect(call).toMatchObject({
      userId: 'user-asha',
      demoKey: 'restaurant',
      stepKind: 'text',
      label: null,
    });
    expect(call?.meta).toMatchObject({ ok: false, error: 'NOT_CONFIGURED', tokens: 0 });
  });

  it('refuses a caller over the rate limit without calling the model', async () => {
    await configure();
    mockAllow.mockResolvedValueOnce(false);
    const result = await parseAs(actor, input);
    expect(result).toMatchObject({ ok: false, error: 'RATE_LIMITED', latencyMs: 0 });
    expect(mockAllow).toHaveBeenCalledWith('user-asha');
    expect(complete).not.toHaveBeenCalled();
    expect((await recordedCall())?.meta).toMatchObject({ error: 'RATE_LIMITED' });
  });

  it('still answers when the outcome cannot be recorded', async () => {
    const error = jest.spyOn(logger, 'error');
    const find = jest.spyOn(WhatsappDemoSessionModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });
    await expect(parseAs(actor, input)).resolves.toMatchObject({ error: 'NOT_CONFIGURED' });
    expect(error).toHaveBeenCalledWith(
      expect.anything(),
      'WhatsApp demo AI call could not be recorded',
    );
    expect(await recordedCall()).toBeNull();
    find.mockRestore();
    error.mockRestore();
  });
});
