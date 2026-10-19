import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamReply, type ReplyRequest } from '../../../src/runtime/llm';

/** A streamed completions response whose body arrives in exactly these pieces. */
function streamed(pieces: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      pieces.forEach((piece) => controller.enqueue(encoder.encode(piece)));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const delta = (content: string | null) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;

function request(overrides: Partial<ReplyRequest> = {}): ReplyRequest {
  return {
    apiKey: 'openai-test-key',
    model: 'gpt-test',
    messages: [{ role: 'user', content: 'Hi' }],
    signal: new AbortController().signal,
    onText: vi.fn(),
    ...overrides,
  };
}

describe('streaming a reply from OpenAI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the conversation and hands over each piece as it arrives', async () => {
    const line = delta('lo');
    const fetchMock = vi.fn().mockResolvedValue(
      streamed([
        ': keep-alive\n',
        delta('Hel'),
        line.slice(0, 10),
        line.slice(10),
        'data: {"choices":[]}\n',
        delta(null),
        'data: \n',
        'data: [DONE]\n',
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onText = vi.fn();
    const signal = new AbortController().signal;

    await expect(streamReply(request({ onText, signal }))).resolves.toBe('Hello');

    expect(onText.mock.calls).toEqual([['Hel'], ['lo']]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers).toEqual({
      Authorization: 'Bearer openai-test-key',
      'Content-Type': 'application/json',
    });
    expect(init.signal).toBe(signal);
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'gpt-test',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
      max_tokens: 220,
    });
  });

  it('ignores an unfinished last line', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamed([delta('Hi'), 'data: {"cho'])));
    await expect(streamReply(request())).resolves.toBe('Hi');
  });

  it('fails when OpenAI refuses the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 401 })));
    await expect(streamReply(request())).rejects.toThrow('OpenAI answered 401');
  });

  it('fails when the answer has no body to stream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    await expect(streamReply(request())).rejects.toThrow('OpenAI answered 200');
  });
});
