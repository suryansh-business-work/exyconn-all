import type { OpenAiConfigDocument } from '../modules/tech/openai-config.model';

const OPENAI_API_URL = 'https://api.openai.com';

/**
 * OpenAI access (singleton). The key and the model come from the active OpenAI config in
 * the Tech module's Environment Variables screen, so rotating either needs no redeploy.
 */
class OpenAiClient {
  private async request<T>(apiKey: string, path: string): Promise<T> {
    const response = await fetch(`${OPENAI_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
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
}

export const openAiClient = new OpenAiClient();
