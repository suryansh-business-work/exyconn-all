import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';
import { parseAs } from '../../../../src/modules/whatsapp-demo/whatsappDemo.parse';
import { WhatsappDemoSessionModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';
import { actor, completion, configure, input, recordedCall } from './parseFixtures';

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

describe("reading the model's answer", () => {
  it('routes on the answer and records only its outcome', async () => {
    const config = await configure();
    complete.mockResolvedValueOnce(
      completion(
        JSON.stringify({
          intent: 'book',
          entities: { guests: 4, when: 'Tue, 6 Oct, 5:00 PM', colour: 'red' },
          datetimes: { when: '2026-10-06T17:00' },
        }),
      ),
    );
    const result = await parseAs(actor, input);
    expect(result).toMatchObject({
      ok: true,
      intent: 'book',
      error: null,
      entities: {
        guests: '4',
        when: 'Tue, 6 Oct, 5:00 PM',
        whenMs: String(Date.UTC(2026, 9, 6, 11, 30)),
      },
    });
    const request = complete.mock.calls[0][0];
    expect(request).toMatchObject({ apiKey: config.apiKey, model: 'gpt-4o-mini', json: true });
    expect(JSON.parse(request.prompt)).toMatchObject({
      timezone: 'Asia/Kolkata',
      message: input.text,
    });
    const call = await recordedCall();
    expect(call?.meta).toMatchObject({ ok: true, intent: 'book', tokens: 42, error: null });
    expect(JSON.stringify(call)).not.toContain(input.text);
    expect(await WhatsappDemoSessionModel.countDocuments({ sessionId: 'session-1' })).toBe(1);
  });

  it('bounds what the client may put into the prompt', async () => {
    await configure();
    complete.mockResolvedValueOnce(completion('{}'));
    await parseAs(actor, {
      ...input,
      text: 'x'.repeat(600),
      intents: Array.from({ length: 25 }, (_, n) => ({
        id: `intent-${n}`,
        description: 'd'.repeat(300),
      })),
      entities: Array.from({ length: 25 }, (_, n) => ({
        name: `e${n}`,
        kind: 'text-of-some-kind',
        description: 'd',
      })),
    });
    const prompt = JSON.parse(complete.mock.calls[0][0].prompt);
    expect(prompt.message).toHaveLength(500);
    expect(prompt.intents).toHaveLength(20);
    expect(prompt.intents[0].description).toHaveLength(200);
    expect(prompt.entities).toHaveLength(20);
    expect(prompt.entities[0].kind).toHaveLength(16);
  });

  it('fails an answer that is not JSON, keeping its token count', async () => {
    await configure();
    complete.mockResolvedValueOnce(completion('Sure! Tomorrow at 5.'));
    const result = await parseAs(actor, input);
    expect(result).toMatchObject({ ok: false, error: 'FAILED' });
    expect((await recordedCall())?.meta).toMatchObject({ tokens: 42, error: 'FAILED' });
  });

  it('fails JSON of the wrong shape', async () => {
    await configure();
    complete.mockResolvedValueOnce(completion(JSON.stringify({ intent: 7 })));
    await expect(parseAs(actor, input)).resolves.toMatchObject({ ok: false, error: 'FAILED' });
  });

  it('fails when the request errors, logging no customer text', async () => {
    await configure();
    const warn = jest.spyOn(logger, 'warn');
    complete.mockRejectedValueOnce(new Error('OpenAI request failed: 500'));
    await expect(parseAs(actor, input)).resolves.toMatchObject({ ok: false, error: 'FAILED' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(input.text);
    warn.mockRestore();
  });

  it('fails when the request throws something that is not an Error', async () => {
    await configure();
    complete.mockRejectedValueOnce('socket hang up');
    await expect(parseAs(actor, input)).resolves.toMatchObject({ ok: false, error: 'FAILED' });
  });

  it('times out when the model takes too long', async () => {
    await configure();
    const realSetTimeout = globalThis.setTimeout;
    const timers = jest.spyOn(globalThis, 'setTimeout').mockImplementation(((
      handler: () => void,
      ms?: number,
    ) => {
      if (ms === 8000) {
        handler();
        return realSetTimeout(() => undefined, 0);
      }
      return realSetTimeout(handler, ms);
    }) as typeof setTimeout);
    complete.mockImplementationOnce(async ({ signal }) => {
      if (signal?.aborted) {
        throw new Error('aborted');
      }
      return completion('{}');
    });
    const result = await parseAs(actor, input);
    timers.mockRestore();
    expect(result).toMatchObject({ ok: false, error: 'TIMEOUT' });
  });
});
