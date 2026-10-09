import { openAiClient } from '../../../src/utils/openai';
import type { OpenAiConfigDocument } from '../../../src/modules/tech/openai-config.model';

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

/** The URL and init of the one request the client made. */
function sent(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init };
}

describe('verify', () => {
  it('asks for the configured model by its encoded id, with the key', async () => {
    fetchMock.mockResolvedValue(json({ id: 'ft:gpt/x' }));
    const config = { apiKey, defaultModel: 'ft:gpt/x' } as OpenAiConfigDocument;
    await openAiClient.verify(config);
    const { url, init } = sent();
    expect(url).toBe('https://api.openai.com/v1/models/ft%3Agpt%2Fx');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Authorization: `Bearer ${apiKey}` });
  });

  it('throws with the status and at most 200 characters of the answer', async () => {
    fetchMock.mockResolvedValue(new Response('x'.repeat(500), { status: 404 }));
    const config = { apiKey, defaultModel: 'gpt-x' } as OpenAiConfigDocument;
    const error = await openAiClient.verify(config).catch((error_: Error) => error_);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      `OpenAI /v1/models/gpt-x failed (404): ${'x'.repeat(200)}`,
    );
  });
});

describe('listModels', () => {
  it('returns every model id, sorted', async () => {
    fetchMock.mockResolvedValue(
      json({ data: [{ id: 'gpt-b' }, { id: 'gpt-a' }, { id: 'dall-e' }] }),
    );
    await expect(openAiClient.listModels(apiKey)).resolves.toEqual(['dall-e', 'gpt-a', 'gpt-b']);
    expect(sent().url).toBe('https://api.openai.com/v1/models');
  });
});

describe('embed', () => {
  it('posts the inputs and returns one vector per input, in input order', async () => {
    fetchMock.mockResolvedValue(
      json({
        data: [
          { index: 1, embedding: [0.2] },
          { index: 0, embedding: [0.1] },
        ],
      }),
    );
    const controller = new AbortController();
    const vectors = await openAiClient.embed(apiKey, 'emb-1', ['a', 'b'], controller.signal);
    expect(vectors).toEqual([[0.1], [0.2]]);
    const { url, init } = sent();
    expect(url).toBe('https://api.openai.com/v1/embeddings');
    expect(init.method).toBe('POST');
    expect(init.signal).toBe(controller.signal);
    expect(init.headers).toEqual({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init.body))).toEqual({ model: 'emb-1', input: ['a', 'b'] });
  });
});

describe('complete', () => {
  it('sends the system message first and asks for JSON when told to', async () => {
    fetchMock.mockResolvedValue(
      json({
        choices: [{ message: { content: '{"ok":true}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    );
    const result = await openAiClient.complete({
      apiKey,
      model: 'gpt-x',
      prompt: 'Summarise',
      system: 'Be brief',
      json: true,
    });
    expect(result).toEqual({
      text: '{"ok":true}',
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
    expect(JSON.parse(String(sent().init.body))).toEqual({
      model: 'gpt-x',
      messages: [
        { role: 'system', content: 'Be brief' },
        { role: 'user', content: 'Summarise' },
      ],
      response_format: { type: 'json_object' },
    });
  });

  it('sends only the prompt when there is no system message or JSON mode', async () => {
    fetchMock.mockResolvedValue(json({ choices: [{ message: { content: 'Hi' } }] }));
    const result = await openAiClient.complete({ apiKey, model: 'gpt-x', prompt: 'Hello' });
    expect(result).toEqual({ text: 'Hi', promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    expect(JSON.parse(String(sent().init.body))).toEqual({
      model: 'gpt-x',
      messages: [{ role: 'user', content: 'Hello' }],
    });
  });

  it('answers empty text when the model returned no content or no choice', async () => {
    fetchMock.mockResolvedValueOnce(json({ choices: [{ message: { content: null } }] }));
    await expect(
      openAiClient.complete({ apiKey, model: 'gpt-x', prompt: 'p' }),
    ).resolves.toMatchObject({ text: '' });
    fetchMock.mockResolvedValueOnce(json({ choices: [] }));
    await expect(
      openAiClient.complete({ apiKey, model: 'gpt-x', prompt: 'p' }),
    ).resolves.toMatchObject({ text: '' });
    fetchMock.mockResolvedValueOnce(json({ choices: [{}] }));
    await expect(
      openAiClient.complete({ apiKey, model: 'gpt-x', prompt: 'p' }),
    ).resolves.toMatchObject({ text: '' });
  });

  it('reports a failed completion with its status', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));
    await expect(openAiClient.complete({ apiKey, model: 'gpt-x', prompt: 'p' })).rejects.toThrow(
      'OpenAI /v1/chat/completions failed (429): rate limited',
    );
  });
});
