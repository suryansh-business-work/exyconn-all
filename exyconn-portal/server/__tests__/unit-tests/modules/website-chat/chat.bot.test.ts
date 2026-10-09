import { answerQuestion } from '../../../../src/modules/website-chat/chat.bot';
import { knowledgeFor } from '../../../../src/modules/website-chat/chat.retrieve';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { ChatMessageModel, ChatSettingsModel } from '../../../../src/modules/website-chat/models';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';
import { createSession, fakePeer, framesOf } from './chat.fixtures';

jest.mock('../../../../src/utils/openai', () => ({ openAiClient: { complete: jest.fn() } }));
jest.mock('../../../../src/modules/website-chat/chat.retrieve', () => ({
  knowledgeFor: jest.fn(),
}));
jest.mock('../../../../src/lib/rateLimiter', () => {
  const botAllow = jest.fn();
  return { createLimiter: () => ({ allow: botAllow }), botAllow };
});

const { botAllow } = jest.requireMock<{ botAllow: jest.Mock }>('../../../../src/lib/rateLimiter');
const complete = openAiClient.complete as jest.Mock;
const knowledge = knowledgeFor as jest.Mock;
const apiKey = `sk-test-${Date.now()}`;

const reply = (answer: unknown) => complete.mockResolvedValue({ text: JSON.stringify(answer) });

async function setup() {
  const session = await createSession();
  const sessionId = String(session._id);
  const visitor = fakePeer({ role: 'visitor', sessionId });
  chatHub.join(visitor.peer);
  return { sessionId, visitor };
}

/** The bot's latest answer as stored (a test may seed earlier bot lines). */
const botLine = async () => ChatMessageModel.findOne({ sender: 'BOT' }).sort({ _id: -1 }).lean();

beforeEach(async () => {
  botAllow.mockResolvedValue(true);
  knowledge.mockResolvedValue({ text: '[1] Pricing\nPlans.', sources: [] });
  await ChatSettingsModel.create({ botName: 'Exy', refusalMessage: 'Only Exyconn, sorry.' });
  await OpenAiConfigModel.create({ label: 'Main', apiKey, defaultModel: 'gpt-4o', isActive: true });
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('answerQuestion', () => {
  it('answers from the knowledge with its cited sources and follow-ups', async () => {
    const { sessionId, visitor } = await setup();
    const base = Date.now() - 60_000;
    await ChatMessageModel.insertMany([
      {
        sessionId,
        channel: 'KNOWLEDGE',
        sender: 'VISITOR',
        body: 'Earlier q',
        createdAt: new Date(base),
      },
      {
        sessionId,
        channel: 'KNOWLEDGE',
        sender: 'BOT',
        body: 'Earlier a',
        createdAt: new Date(base + 1),
      },
      {
        sessionId,
        channel: 'KNOWLEDGE',
        sender: 'SYSTEM',
        body: 'Notice',
        createdAt: new Date(base + 2),
      },
      {
        sessionId,
        channel: 'LIVE',
        sender: 'VISITOR',
        body: 'Live line',
        createdAt: new Date(base + 3),
      },
      {
        sessionId,
        channel: 'KNOWLEDGE',
        sender: 'VISITOR',
        body: 'Pricing?',
        createdAt: new Date(base + 4),
      },
    ]);
    knowledge.mockResolvedValue({
      text: '[1] Pricing\nPlans.',
      sources: [
        { title: 'Pricing', url: 'https://exyconn.com/pricing' },
        { title: 'Careers', url: '' },
      ],
    });
    reply({
      inScope: true,
      answer: `  ${'a'.repeat(1600)}  `,
      sources: [1, 2, 9, 1],
      followUps: [' What about support? ', '  ', 'b'.repeat(130), 'Three', 'Four'],
    });

    await answerQuestion(sessionId, 'Pricing?', 'KNOWLEDGE');

    expect(knowledge).toHaveBeenCalledWith('Pricing?', 12000, '', {
      apiKey,
      model: 'text-embedding-3-small',
    });
    const request = complete.mock.calls[0][0];
    expect(request).toMatchObject({ apiKey, model: 'gpt-4o', json: true });
    expect(request.system).toContain('You are Exy');
    expect(request.system).toContain('[1] Pricing\nPlans.');
    expect(request.prompt).toBe(
      "Conversation so far:\nVisitor: Earlier q\nAssistant: Earlier a\n\nVisitor's new message:\nPricing?",
    );
    expect(request.signal).toBeInstanceOf(AbortSignal);

    const stored = await botLine();
    expect(stored).toMatchObject({
      channel: 'KNOWLEDGE',
      senderName: 'Exy',
      body: 'a'.repeat(1500),
    });
    expect(stored?.sources).toEqual([
      { title: 'Pricing', url: 'https://exyconn.com/pricing' },
      { title: 'Careers', url: '' },
    ]);
    expect(stored?.suggestions).toEqual(['What about support?', 'b'.repeat(120), 'Three']);
    const typing = framesOf(visitor.socket).filter((frame) => frame.t === 'typing');
    expect(typing).toEqual([
      { t: 'typing', who: 'BOT', name: 'Exy', channel: 'KNOWLEDGE', on: true },
      { t: 'typing', who: 'BOT', name: 'Exy', channel: 'KNOWLEDGE', on: false },
    ]);
  });

  it.each([
    ['out of scope', JSON.stringify({ inScope: false, answer: 'Sure, a poem…' })],
    ['an empty answer', JSON.stringify({ inScope: true, answer: '   ' })],
    ['not JSON', 'Here is my answer'],
    ['the wrong shape', JSON.stringify({ answer: 'No flag' })],
  ])('gives the configured refusal for %s', async (_case, text) => {
    const { sessionId } = await setup();
    complete.mockResolvedValue({ text });
    await answerQuestion(sessionId, 'Write me a poem', 'LIVE');
    expect(await botLine()).toMatchObject({ channel: 'LIVE', body: 'Only Exyconn, sorry.' });
    expect((await botLine())?.sources).toEqual([]);
  });

  it('asks the visitor to slow down once the session spent its answers', async () => {
    const { sessionId } = await setup();
    botAllow.mockResolvedValue(false);
    await answerQuestion(sessionId, 'Again?', 'KNOWLEDGE');
    expect((await botLine())?.body).toBe(
      'You have asked a lot of questions in a short time. Please wait a few minutes.',
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it('apologises when no OpenAI key is configured', async () => {
    const { sessionId } = await setup();
    await OpenAiConfigModel.deleteMany({});
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await answerQuestion(sessionId, 'Pricing?', 'KNOWLEDGE');
    expect((await botLine())?.body).toMatch(/^Sorry, I cannot answer right now\./);
    expect(warned).toHaveBeenCalledTimes(1);
    expect(knowledge).not.toHaveBeenCalled();
  });

  it('apologises and stops typing when the model fails', async () => {
    const { sessionId, visitor } = await setup();
    complete.mockRejectedValue(new Error('OpenAI timeout'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await answerQuestion(sessionId, 'Pricing?', 'KNOWLEDGE');
    expect((await botLine())?.body).toMatch(/^Sorry, I cannot answer right now\./);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat bot answer failed',
    );
    const typing = framesOf(visitor.socket).filter((frame) => frame.t === 'typing');
    expect(typing.map((frame) => frame.on)).toEqual([true, false]);
  });
});
