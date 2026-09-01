/** The secrets-drawer key every OpenAI-backed tool reads. */
export const OPENAI_SECRET_KEY = 'openai_api_key';

/**
 * An OpenAI HTTP failure that keeps the status code. Without it a rejected key
 * looks exactly like a transient error, so a tool could not tell the user to
 * fix the key rather than retry.
 */
export class OpenAIRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OpenAIRequestError';
    this.status = status;
  }
}

/** True when OpenAI refused the key we sent rather than the request itself. */
export const isKeyRejected = (error: unknown): boolean =>
  error instanceof OpenAIRequestError && (error.status === 401 || error.status === 403);

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface OpenAIResult {
  content: string;
  usage: TokenUsage;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export const generateWithOpenAI = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-4o-mini'
): Promise<OpenAIResult> => {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2000 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new OpenAIRequestError(error.error?.message || 'Failed to generate response', response.status);
  }

  const data: OpenAIResponse = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
};
