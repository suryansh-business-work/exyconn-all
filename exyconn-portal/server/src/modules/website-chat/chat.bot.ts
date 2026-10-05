import { z } from 'zod';
import { createLimiter } from '../../lib/rateLimiter';
import { inTurn } from '../../lib/inTurn';
import { currentOrganizationId } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { openAiClient } from '../../utils/openai';
import { OpenAiConfigModel } from '../tech/openai-config.model';
import { ChatMessageModel } from './models';
import { chatHub } from './chat.hub';
import { postMessage } from './chat.messages';
import { knowledgeFor } from './chat.retrieve';
import { readChatSettings } from './chat.settings';
import { systemPrompt, userPrompt, type BotTurn } from './chat.prompt';

const HISTORY_TURNS = 6;
const ANSWER_CHARS = 1500;
const TIMEOUT_MS = 30_000;
const UNAVAILABLE =
  'Sorry, I cannot answer right now. Please try again in a moment, or ask our team in the Chat with us tab.';
const SLOW_DOWN = 'You have asked a lot of questions in a short time. Please wait a few minutes.';

/** A conversation does not get to run up the AI bill: thirty answers an hour per session. */
const botLimiter = createLimiter({ keyPrefix: 'website_chat_bot', points: 30, durationSec: 3600 });

const answerSchema = z.object({ inScope: z.boolean(), answer: z.string() });

function parseAnswer(text: string): z.infer<typeof answerSchema> | null {
  try {
    const parsed = answerSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The knowledge thread's last few turns before the question just asked. */
async function recentTurns(sessionId: string): Promise<BotTurn[]> {
  const rows = await ChatMessageModel.find({ sessionId, channel: 'KNOWLEDGE' })
    .sort({ createdAt: -1 })
    .skip(1)
    .limit(HISTORY_TURNS)
    .select('sender body')
    .lean();
  return rows.reverse().map((row) => ({ fromVisitor: row.sender === 'VISITOR', body: row.body }));
}

/** Asks the model; returns what the visitor should read. */
async function compose(sessionId: string, question: string): Promise<string> {
  const settings = await readChatSettings();
  if (!(await botLimiter.allow(sessionId))) {
    return SLOW_DOWN;
  }
  const config = await OpenAiConfigModel.findOne({ isActive: true }).select('apiKey').lean();
  if (!config) {
    logger.warn(
      'Website chat bot has no active OpenAI configuration (Tech > Environment Variables)',
    );
    return UNAVAILABLE;
  }
  const knowledge = await knowledgeFor(
    question,
    settings.maxContextChars,
    currentOrganizationId() ?? '',
  );
  const completion = await openAiClient.complete({
    apiKey: config.apiKey,
    model: settings.botModel,
    system: systemPrompt({
      botName: settings.botName,
      customInstructions: settings.customInstructions,
      knowledge,
    }),
    prompt: userPrompt(await recentTurns(sessionId), question),
    json: true,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const answer = parseAnswer(completion.text);
  if (!answer?.inScope || answer.answer.trim() === '') {
    return settings.refusalMessage;
  }
  return answer.answer.trim().slice(0, ANSWER_CHARS);
}

/**
 * Answers a question in the session's knowledge thread, one at a time per session, with the
 * bot shown typing meanwhile. A failure is logged and the visitor told plainly; it never
 * leaves the question hanging.
 */
export function answerQuestion(sessionId: string, question: string): Promise<void> {
  return inTurn(`website-chat-bot:${sessionId}`, async () => {
    const { botName } = await readChatSettings();
    const typing = (on: boolean) =>
      chatHub.toVisitors(sessionId, { t: 'typing', who: 'BOT', name: botName, on });
    typing(true);
    let body: string;
    try {
      body = await compose(sessionId, question);
    } catch (error) {
      logger.error({ err: error }, 'Website chat bot answer failed');
      body = UNAVAILABLE;
    } finally {
      typing(false);
    }
    await postMessage({
      sessionId,
      channel: 'KNOWLEDGE',
      sender: 'BOT',
      senderName: botName,
      body,
    });
  });
}
