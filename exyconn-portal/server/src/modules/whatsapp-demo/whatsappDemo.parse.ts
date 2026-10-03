import { randomUUID } from 'node:crypto';
import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient, type CompletionResult } from '../../utils/openai';
import { createLimiter } from '../../lib/rateLimiter';
import { companyTimezone, localNow } from './whatsappDemo.zone';
import { logger } from '../../utils/logger';
import { storeEvents } from './whatsappDemo.events';
import {
  SYSTEM_PROMPT,
  answerSchema,
  pickAnswer,
  userPrompt,
  type ParseEntity,
  type ParseIntent,
} from './whatsappDemo.prompt';
import type { TokenPayload } from '../../utils/jwt';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Free text the chat engine cannot read itself — "kal shaam 5 baje 4 log" — goes to OpenAI
 * with the node's intents and entities, and comes back as JSON the engine can route on.
 *
 * The key and model are the active OpenAI config from Tech > Environment Variables. Nothing
 * the customer typed is stored or logged: the AI_CALL event carries only the outcome.
 */

const TEXT_MAX = 500;
const TIMEOUT_MS = 8000;

const parseLimiter = createLimiter({
  keyPrefix: 'whatsapp-demo-parse',
  points: 30,
  durationSec: 60,
});

export type ParseError = 'NOT_CONFIGURED' | 'TIMEOUT' | 'RATE_LIMITED' | 'FAILED';

export interface ParseInput {
  sessionId: string;
  demoKey: string;
  workflow: string;
  node: string;
  text: string;
  intents: ParseIntent[];
  entities: ParseEntity[];
}

export interface ParseResult {
  ok: boolean;
  intent: string | null;
  entities: Record<string, string>;
  latencyMs: number;
  error: ParseError | null;
}

export async function aiStatus() {
  const config = await OpenAiConfigModel.findOne({ isActive: true }).select('defaultModel').lean();
  return { configured: Boolean(config), model: config?.defaultModel ?? null };
}

const failed = (error: ParseError, latencyMs = 0): ParseResult => ({
  ok: false,
  intent: null,
  entities: {},
  latencyMs,
  error,
});

/** Bounds what the client may put into the prompt. */
function boundedInput(input: ParseInput) {
  return {
    text: input.text.slice(0, TEXT_MAX),
    intents: input.intents
      .slice(0, 20)
      .map((i) => ({ id: i.id.slice(0, 64), description: i.description.slice(0, 200) })),
    entities: input.entities.slice(0, 20).map((e) => ({
      name: e.name.slice(0, 64),
      kind: e.kind.slice(0, 16),
      description: e.description.slice(0, 200),
    })),
  };
}

async function callModel(input: ParseInput): Promise<{ result: ParseResult; tokens: number }> {
  const config = await OpenAiConfigModel.findOne({ isActive: true }).lean();
  if (!config) {
    return { result: failed('NOT_CONFIGURED'), tokens: 0 };
  }
  const { text, intents, entities } = boundedInput(input);
  const timeZone = await companyTimezone();
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let completion: CompletionResult;
  try {
    completion = await openAiClient.complete({
      apiKey: config.apiKey,
      model: config.defaultModel,
      system: SYSTEM_PROMPT,
      prompt: userPrompt(text, intents, entities, localNow(started, timeZone), timeZone),
      json: true,
      signal: controller.signal,
    });
  } catch (error) {
    const code: ParseError = controller.signal.aborted ? 'TIMEOUT' : 'FAILED';
    logger.warn(
      { err: error instanceof Error ? error.message.slice(0, 120) : code, code },
      'WhatsApp demo AI parse failed',
    );
    return { result: failed(code, Date.now() - started), tokens: 0 };
  } finally {
    clearTimeout(timer);
  }
  const latencyMs = Date.now() - started;
  const answer = answerSchema.safeParse(safeJson(completion.text));
  if (!answer.success) {
    logger.warn(
      { code: 'FAILED', latencyMs },
      'WhatsApp demo AI parse returned an unusable answer',
    );
    return { result: failed('FAILED', latencyMs), tokens: completion.totalTokens };
  }
  const picked = pickAnswer(answer.data, intents, entities, timeZone);
  return {
    result: { ok: true, ...picked, latencyMs, error: null },
    tokens: completion.totalTokens,
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Records the call's outcome — never its text — as an AI_CALL event. */
async function recordCall(
  ctx: GraphQLContext,
  user: TokenPayload,
  input: ParseInput,
  result: ParseResult,
  tokens: number,
) {
  try {
    await storeEvents(ctx, user, [
      {
        eventId: `ai-${randomUUID()}`,
        sessionId: input.sessionId.slice(0, 64),
        userId: user.id,
        type: 'AI_CALL',
        at: new Date(),
        demoKey: input.demoKey.slice(0, 64),
        workflow: input.workflow.slice(0, 64),
        node: input.node.slice(0, 64),
        stepKind: 'text',
        label: null,
        durationMs: result.latencyMs,
        meta: {
          ok: result.ok,
          latencyMs: result.latencyMs,
          tokens,
          error: result.error,
          intent: result.intent,
        },
      },
    ]);
  } catch (error) {
    logger.error({ err: error }, 'WhatsApp demo AI call could not be recorded');
  }
}

export async function parse(
  ctx: GraphQLContext,
  user: TokenPayload,
  input: ParseInput,
): Promise<ParseResult> {
  let outcome: { result: ParseResult; tokens: number };
  if (await parseLimiter.allow(user.id)) {
    outcome = await callModel(input);
  } else {
    outcome = { result: failed('RATE_LIMITED'), tokens: 0 };
  }
  await recordCall(ctx, user, input, outcome.result, outcome.tokens);
  return outcome.result;
}
