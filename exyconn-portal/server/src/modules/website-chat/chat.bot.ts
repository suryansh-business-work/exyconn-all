import { z } from 'zod';
import { createLimiter } from '../../lib/rateLimiter';
import { inTurn } from '../../lib/inTurn';
import { currentOrganizationId } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { openAiClient } from '../../utils/openai';
import { OpenAiConfigModel } from '../tech/openai-config.model';
import { ChatMessageModel, type ChatChannel } from './models';
import { chatHub } from './chat.hub';
import { postMessage, type NewChatMessage } from './chat.messages';
import { knowledgeFor, type KnowledgeSource } from './chat.retrieve';
import { readChatSettings } from './chat.settings';
import { systemPrompt, userPrompt, type BotTurn } from './chat.prompt';

const HISTORY_TURNS = 6;
const ANSWER_CHARS = 1500;
const MAX_SUGGESTIONS = 3;
const SUGGESTION_CHARS = 120;
const TIMEOUT_MS = 30_000;
const UNAVAILABLE =
  'Sorry, I cannot answer right now. Please try again in a moment, or ask our team in the Chat with us tab.';
const SLOW_DOWN = 'You have asked a lot of questions in a short time. Please wait a few minutes.';

/** A conversation does not get to run up the AI bill: thirty answers an hour per session. */
const botLimiter = createLimiter({ keyPrefix: 'website_chat_bot', points: 30, durationSec: 3600 });

const answerSchema = z.object({
  inScope: z.boolean(),
  answer: z.string(),
  sources: z.array(z.number().int()).default([]),
  followUps: z.array(z.string()).default([]),
});

type BotAnswer = Pick<NewChatMessage, 'body' | 'sources' | 'suggestions'>;

function parseAnswer(text: string): z.infer<typeof answerSchema> | null {
  try {
    const parsed = answerSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The thread's last few turns before the question just asked (notices left out). */
async function recentTurns(sessionId: string, channel: ChatChannel): Promise<BotTurn[]> {
  const rows = await ChatMessageModel.find({ sessionId, channel, sender: { $ne: 'SYSTEM' } })
    .sort({ createdAt: -1 })
    .skip(1)
    .limit(HISTORY_TURNS)
    .select('sender body')
    .lean();
  rows.reverse();
  return rows.map((row) => ({ fromVisitor: row.sender === 'VISITOR', body: row.body }));
}

/** The blocks the model said it used, each page once, in the order it named them. */
function citedSources(numbers: number[], given: KnowledgeSource[]): KnowledgeSource[] {
  const seen = new Set<string>();
  return numbers
    .map((n) => given[n - 1])
    .filter((source): source is KnowledgeSource => {
      const key = source?.url || source?.title;
      if (!source || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

/** Asks the model; returns what the visitor should read, with its sources and follow-ups. */
async function compose(
  sessionId: string,
  question: string,
  channel: ChatChannel,
): Promise<BotAnswer> {
  const settings = await readChatSettings();
  if (!(await botLimiter.allow(sessionId))) {
    return { body: SLOW_DOWN };
  }
  const config = await OpenAiConfigModel.findOne({ isActive: true }).select('apiKey').lean();
  if (!config) {
    logger.warn(
      'Website chat bot has no active OpenAI configuration (Tech > Environment Variables)',
    );
    return { body: UNAVAILABLE };
  }
  const embedder = { apiKey: config.apiKey, model: settings.embeddingModel };
  const knowledge = await knowledgeFor(
    question,
    settings.maxContextChars,
    currentOrganizationId() ?? '',
    embedder,
  );
  const completion = await openAiClient.complete({
    apiKey: config.apiKey,
    model: settings.botModel,
    system: systemPrompt({
      botName: settings.botName,
      customInstructions: settings.customInstructions,
      knowledge: knowledge.text,
    }),
    prompt: userPrompt(await recentTurns(sessionId, channel), question),
    json: true,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const answer = parseAnswer(completion.text);
  if (!answer?.inScope || answer.answer.trim() === '') {
    return { body: settings.refusalMessage };
  }
  return {
    body: answer.answer.trim().slice(0, ANSWER_CHARS),
    sources: citedSources(answer.sources, knowledge.sources),
    suggestions: answer.followUps
      .map((text) => text.trim().slice(0, SUGGESTION_CHARS))
      .filter(Boolean)
      .slice(0, MAX_SUGGESTIONS),
  };
}

/**
 * Answers a question in the thread it was asked in — the Knowledge Bot tab, or the live thread
 * when nobody on the team answered in time — one at a time per session, with the bot shown
 * typing meanwhile. A failure is logged and the visitor told plainly; it never leaves the
 * question hanging.
 */
export function answerQuestion(
  sessionId: string,
  question: string,
  channel: ChatChannel,
): Promise<void> {
  return inTurn(`website-chat-bot:${sessionId}`, async () => {
    const { botName } = await readChatSettings();
    const typing = (on: boolean) =>
      chatHub.toVisitors(sessionId, { t: 'typing', who: 'BOT', name: botName, channel, on });
    typing(true);
    let answer: BotAnswer;
    try {
      answer = await compose(sessionId, question, channel);
    } catch (error) {
      logger.error({ err: error }, 'Website chat bot answer failed');
      answer = { body: UNAVAILABLE };
    } finally {
      typing(false);
    }
    await postMessage({ sessionId, channel, sender: 'BOT', senderName: botName, ...answer });
  });
}
