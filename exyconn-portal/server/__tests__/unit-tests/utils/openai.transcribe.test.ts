import { OpenAiError, openAiClient, withOpenAiRetry } from '../../../src/utils/openai';

const apiKey = `sk-test-${Date.now()}`;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
});

/** The multipart form of the one transcription request the client made. */
function sentForm(): FormData {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
  expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${apiKey}`);
  return init.body as FormData;
}

const request = (overrides: Record<string, unknown> = {}) => ({
  apiKey,
  model: 'gpt-4o-transcribe',
  audio: Buffer.from('RIFF'),
  mimeType: 'audio/wav',
  ...overrides,
});

describe('transcribe', () => {
  it('asks a plain model for JSON with the vocabulary hint and the language', async () => {
    fetchMock.mockResolvedValue(
      json({
        text: ' namaste team ',
        language: 'hi',
        usage: { input_tokens: 12, output_tokens: 3 },
      }),
    );

    const result = await openAiClient.transcribe(request({ prompt: 'Hinglish', language: 'hi' }));

    const form = sentForm();
    expect(form.get('model')).toBe('gpt-4o-transcribe');
    expect(form.get('response_format')).toBe('json');
    expect(form.get('prompt')).toBe('Hinglish');
    expect(form.get('language')).toBe('hi');
    expect(form.get('chunking_strategy')).toBeNull();
    expect((form.get('file') as File).name).toBe('chunk.wav');
    expect(result).toEqual({
      text: 'namaste team',
      language: 'hi',
      segments: [],
      promptTokens: 12,
      completionTokens: 3,
    });
  });

  it('asks a diarize model for speaker stretches, without a prompt it would reject', async () => {
    fetchMock.mockResolvedValue(
      json({
        text: 'hi there',
        segments: [
          { speaker: 'A', start: 0.25, end: 1.5, text: ' hi ' },
          { speaker: 'B', start: 2, end: 3, text: '   ' },
          { text: 'there' },
        ],
      }),
    );

    const result = await openAiClient.transcribe(
      request({
        model: 'gpt-4o-transcribe-diarize',
        prompt: 'ignored',
        mimeType: 'audio/webm;codecs=opus',
      }),
    );

    const form = sentForm();
    expect(form.get('response_format')).toBe('diarized_json');
    expect(form.get('chunking_strategy')).toBe('auto');
    expect(form.get('prompt')).toBeNull();
    expect(form.get('language')).toBeNull();
    expect((form.get('file') as File).name).toBe('chunk.webm');
    expect(result.segments).toEqual([
      { speaker: 'A', startMs: 250, endMs: 1500, text: 'hi' },
      { speaker: null, startMs: 0, endMs: 0, text: 'there' },
    ]);
    expect(result).toMatchObject({ language: null, promptTokens: 0, completionTokens: 0 });
  });

  it('reports a refusal with its status', async () => {
    fetchMock.mockResolvedValue(new Response('bad audio', { status: 400 }));

    const error = await openAiClient.transcribe(request()).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OpenAiError);
    expect(error).toMatchObject({ status: 400, retryable: false });
    expect((error as Error).message).toContain('bad audio');
  });

  it('answers empty text when the model returned none', async () => {
    fetchMock.mockResolvedValue(json({}));

    expect((await openAiClient.transcribe(request())).text).toBe('');
  });
});

describe('withOpenAiRetry', () => {
  const policy = { attempts: 3, baseDelayMs: 1 };

  it('tries again after a rate limit or a server fault, then succeeds', async () => {
    const call = jest
      .fn()
      .mockRejectedValueOnce(new OpenAiError('slow down', 429))
      .mockRejectedValueOnce(new OpenAiError('overloaded', 503))
      .mockResolvedValueOnce('ok');

    await expect(withOpenAiRetry(call, policy)).resolves.toBe('ok');
    expect(call).toHaveBeenCalledTimes(3);
  });

  it('stops after the policy’s attempts', async () => {
    const call = jest.fn().mockRejectedValue(new OpenAiError('down', 500));

    await expect(withOpenAiRetry(call, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('down');
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('never retries a bad request, a bad key or an error that is not OpenAI’s', async () => {
    const badRequest = jest.fn().mockRejectedValue(new OpenAiError('bad', 400));
    const badKey = jest.fn().mockRejectedValue(new OpenAiError('key', 401));
    const timeout = jest.fn().mockRejectedValue(new Error('aborted'));

    await expect(withOpenAiRetry(badRequest, policy)).rejects.toThrow('bad');
    await expect(withOpenAiRetry(badKey, policy)).rejects.toThrow('key');
    await expect(withOpenAiRetry(timeout, policy)).rejects.toThrow('aborted');
    expect([badRequest, badKey, timeout].map((call) => call.mock.calls.length)).toEqual([1, 1, 1]);
  });
});
