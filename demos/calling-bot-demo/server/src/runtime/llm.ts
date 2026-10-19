/** OpenAI chat completions, streamed: the reply is spoken while it is still being written. */
const COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

/** A spoken reply is a sentence or two; a cap keeps a runaway answer off the line. */
const MAX_TOKENS = 220;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ReplyRequest {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal: AbortSignal;
  /** Each piece of the reply as it arrives. */
  onText: (text: string) => void;
}

/** The text in one server-sent `data:` line, or '' for anything else. */
function deltaOf(line: string): string {
  if (!line.startsWith('data: ')) {
    return '';
  }
  const data = line.slice('data: '.length).trim();
  if (data === '' || data === '[DONE]') {
    return '';
  }
  const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string | null } }> };
  return chunk.choices?.[0]?.delta?.content ?? '';
}

/** Streams one reply and resolves to all of it. Rejects if aborted (the caller talked over it). */
export async function streamReply(request: ReplyRequest): Promise<string> {
  const response = await fetch(COMPLETIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${request.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      stream: true,
      max_tokens: MAX_TOKENS,
    }),
    signal: request.signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`OpenAI answered ${response.status}`);
  }
  const decoder = new TextDecoder();
  let pending = '';
  let reply = '';
  for await (const chunk of response.body) {
    pending += decoder.decode(chunk, { stream: true });
    // Only complete lines are read; an unfinished last line waits for the next chunk.
    const cut = pending.lastIndexOf('\n') + 1;
    const lines = pending.slice(0, cut).split('\n');
    pending = pending.slice(cut);
    for (const line of lines) {
      const text = deltaOf(line);
      if (text) {
        reply += text;
        request.onText(text);
      }
    }
  }
  return reply;
}
