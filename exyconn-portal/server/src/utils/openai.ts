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

/** One diarized stretch of speech, as gpt-4o-transcribe-diarize reports it (seconds). */
interface DiarizedSegment {
  speaker?: string;
  start?: number;
  end?: number;
  text?: string;
}

interface TranscriptionResponse {
  text?: string;
  language?: string;
  segments?: DiarizedSegment[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** One audio file to transcribe; the key and model come from the caller's config. */
export interface TranscriptionRequest {
  apiKey: string;
  model: string;
  audio: Buffer;
  /** The upload's media type, e.g. audio/webm. */
  mimeType: string;
  /** ISO-639-1 hint; omitted lets the model detect the language (mixed Hindi-English). */
  language?: string;
  /** Vocabulary / style hint (not supported by the diarize model, which ignores it here). */
  prompt?: string;
  signal?: AbortSignal;
}

/** A transcription: the text, any speaker-labelled stretches, and the tokens it cost. */
export interface TranscriptionResult {
  text: string;
  language: string | null;
  segments: Array<{ speaker: string | null; startMs: number; endMs: number; text: string }>;
  promptTokens: number;
  completionTokens: number;
}

/** The failure of one OpenAI call, with whether trying again could succeed. */
export class OpenAiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'OpenAiError';
  }

  /** Rate limits, overload and server faults pass; a bad key or a bad request does not. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

const isDiarizeModel = (model: string) => model.endsWith('-diarize');

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
      throw new OpenAiError(
        `OpenAI ${path} failed (${response.status}): ${detail.slice(0, 200)}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  /**
   * Speech to text (`/v1/audio/transcriptions`, multipart). A diarize model is asked for
   * speaker-labelled stretches; any other model returns the chunk's text as one stretch.
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const diarize = isDiarizeModel(request.model);
    const form = new FormData();
    const extension = request.mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
    form.append(
      'file',
      new Blob([new Uint8Array(request.audio)], { type: request.mimeType }),
      `chunk.${extension}`,
    );
    form.append('model', request.model);
    form.append('response_format', diarize ? 'diarized_json' : 'json');
    if (diarize) {
      form.append('chunking_strategy', 'auto');
    } else if (request.prompt) {
      form.append('prompt', request.prompt);
    }
    if (request.language) {
      form.append('language', request.language);
    }
    const response = await fetch(`${OPENAI_API_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      signal: request.signal,
      headers: { Authorization: `Bearer ${request.apiKey}` },
      body: form,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new OpenAiError(
        `OpenAI transcription failed (${response.status}): ${detail.slice(0, 200)}`,
        response.status,
      );
    }
    const body = (await response.json()) as TranscriptionResponse;
    const segments = (body.segments ?? [])
      .filter((segment) => (segment.text ?? '').trim() !== '')
      .map((segment) => ({
        speaker: segment.speaker ?? null,
        startMs: Math.round((segment.start ?? 0) * 1000),
        endMs: Math.round((segment.end ?? 0) * 1000),
        text: (segment.text ?? '').trim(),
      }));
    return {
      text: (body.text ?? '').trim(),
      language: body.language ?? null,
      segments,
      promptTokens: body.usage?.input_tokens ?? 0,
      completionTokens: body.usage?.output_tokens ?? 0,
    };
  }

  /**
   * Checks a config end to end: the key is accepted, AND the account can actually reach the
   * model it names. A key that works for a model this organisation is not entitled to would
   * otherwise pass a test here and fail on the first real request.
   */
  async verify(config: Pick<OpenAiConfigDocument, 'apiKey' | 'defaultModel'>): Promise<void> {
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

/** How a retried call backs off: attempts in all, and the first wait (it doubles). */
export interface RetryPolicy {
  attempts: number;
  baseDelayMs: number;
}

const DEFAULT_RETRY: RetryPolicy = { attempts: 3, baseDelayMs: 1_000 };

const pause = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/**
 * Runs an OpenAI call again after a rate limit or a server fault, with exponential backoff
 * and jitter. Anything else — a rejected key, a bad request, a timeout — fails at once.
 */
export async function withOpenAiRetry<T>(
  call: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const retryable = error instanceof OpenAiError && error.retryable;
      if (!retryable || attempt >= policy.attempts) {
        throw error;
      }
      const jitter = Math.random() * policy.baseDelayMs;
      await pause(policy.baseDelayMs * 2 ** (attempt - 1) + jitter);
    }
  }
}
