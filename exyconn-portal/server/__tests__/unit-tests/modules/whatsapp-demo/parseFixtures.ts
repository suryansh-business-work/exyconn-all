import { randomUUID } from 'node:crypto';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import type { CompletionResult } from '../../../../src/utils/openai';
import type { ParseInput } from '../../../../src/modules/whatsapp-demo/whatsappDemo.parse';
import { WhatsappDemoEventModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';

/** Shared setup for the AI parse suites. */

export const actor = { id: 'user-asha', name: 'Asha', email: 'asha@example.com' };

export const input: ParseInput = {
  sessionId: 'session-1',
  demoKey: 'restaurant',
  workflow: 'table',
  node: 'ask-when',
  text: 'kal shaam 5 baje 4 log',
  intents: [{ id: 'book', description: 'Wants a table' }],
  entities: [
    { name: 'guests', kind: 'number', description: 'People' },
    { name: 'when', kind: 'datetime', description: 'Arrival' },
  ],
};

export const completion = (text: string): CompletionResult => ({
  text,
  promptTokens: 30,
  completionTokens: 12,
  totalTokens: 42,
});

/** An active OpenAI config, its key generated so no credential is written down. */
export const configure = () =>
  OpenAiConfigModel.create({
    label: 'Main',
    apiKey: randomUUID(),
    defaultModel: 'gpt-4o-mini',
    isActive: true,
  });

export const recordedCall = () => WhatsappDemoEventModel.findOne({ type: 'AI_CALL' }).lean();
