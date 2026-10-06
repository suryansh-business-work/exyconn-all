import type { OpenAiConfigDocument } from '../modules/tech/openai-config.model';

const OPENAI_API_URL = 'https://api.openai.com';

/** One model the account can reach, as the models endpoint reports it. */
interface ModelListResponse {
  data: Array<{ id: string }>;
}

interface CompletionResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface EmbeddingResponse {
  data: Array<{ index: number; embedding: number[] }>;
}

/** What one finished completion produced, in the shape an AI job stores. */
export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Everything one completion needs. The key and model come from the caller's config. */
export interface CompletionRequest {
  apiKey: string;
  model: string;
  prompt: string;
  /** Instructions sent as the system message, ahead of the prompt. */
  system?: string;
  /** Asks for a JSON object back (OpenAI's JSON mode); the caller still validates it. */
  json?: boolean;
  /** Cancels the request, e.g. on a caller's timeout. */
  signal?: AbortSignal;
}

/**
 * OpenAI access (singleton). The key and the model come from the active OpenAI config in
 * the Tech module's Environment Variables screen, so rotating either needs no redeploy.
 */
class OpenAiClient {
  private async request<T>(
    apiKey: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(`${OPENAI_API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI ${path} failed (${response.status}): ${detail.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  }

  /**
   * Checks a config end to end: the key is accepted, AND the account can actually reach the
   * model it names. A key that works for a model this organisation is not entitled to would
   * otherwise pass a test here and fail on the first real request.
   */
  async verify(config: OpenAiConfigDocument): Promise<void> {
    await this.request(config.apiKey, `/v1/models/${encodeURIComponent(config.defaultModel)}`);
  }

  /**
   * Every model id the key can reach, sorted. Read live rather than listed in code, so a
   * model the account gains — or loses — shows up in the AI module without a release.
   */
  async listModels(apiKey: string): Promise<string[]> {
    const body = await this.request<ModelListResponse>(apiKey, '/v1/models');
    return body.data.map((model) => model.id).sort((a, b) => a.localeCompare(b));
  }

  /** Embeds each text (one vector per input, in order) with an embedding model. */
  async embed(
    apiKey: string,
    model: string,
    input: string[],
    signal?: AbortSignal,
  ): Promise<number[][]> {
    const body = await this.request<EmbeddingResponse>(
      apiKey,
      '/v1/embeddings',
      { model, input },
      signal,
    );
    // The response is ours to reorder: sorting it in place changes nothing anybody else holds.
    body.data.sort((a, b) => a.index - b.index);
    return body.data.map((row) => row.embedding);
  }

  /** Runs one prompt and returns the answer with the token usage it cost. */
  async complete({
    apiKey,
    model,
    prompt,
    system,
    json,
    signal,
  }: CompletionRequest): Promise<CompletionResult> {
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt },
    ];
    const body = await this.request<CompletionResponse>(
      apiKey,
      '/v1/chat/completions',
      { model, messages, ...(json ? { response_format: { type: 'json_object' } } : {}) },
      signal,
    );
    const text = body.choices[0]?.message?.content ?? '';
    return {
      text,
      promptTokens: body.usage?.prompt_tokens ?? 0,
      completionTokens: body.usage?.completion_tokens ?? 0,
      totalTokens: body.usage?.total_tokens ?? 0,
    };
  }
}

export const openAiClient = new OpenAiClient();
