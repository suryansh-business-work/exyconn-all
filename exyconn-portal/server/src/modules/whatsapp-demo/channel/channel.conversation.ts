import type { BotContent, ChatState, PendingPush } from '@exyconn/wa-flow';
import { newChatState } from '@exyconn/wa-flow/engine';
import { engineContext } from './channel.context';
import { industryPicker } from './channel.industries';
import { plan, type Input } from './channel.plan';
import { play } from './channel.play';
import { toPayloads, type RenderTools } from './channel.render';
import { sendMessage, type Sender } from './channel.graph';
import { optionRegistry, publishedBundles, saveChat, type ChatRecord } from './channel.chats';
import {
  actorOf,
  fromSignal,
  recordChatEvents,
  sessionFor,
  type ChatEvent,
} from './channel.analytics';
import { logger } from '../../../utils/logger';

/**
 * One turn of a chat on the real number: decide what the message means, play it through the
 * same engine and published workflows the browser chat runs, send what comes out, and save
 * the chat. Called inside the company's scope, one turn per chat at a time (channel.queue).
 */

interface Outcome {
  demoKey: string | null;
  state: ChatState | null;
  contents: BotContent[];
  pending: PendingPush[];
  events: ChatEvent[];
}

/** Sends in order; stops at the first refusal, since later messages would read out of place. */
async function deliver(sender: Sender, to: string, contents: BotContent[], tools: RenderTools) {
  for (const payload of contents.flatMap((content) => toPayloads(content, tools))) {
    try {
      await sendMessage(sender, to, payload);
    } catch (error) {
      logger.warn(
        { err: error instanceof Error ? error.message : error, type: payload.type },
        'WhatsApp channel could not send a reply',
      );
      return;
    }
  }
}

export async function converse(chat: ChatRecord, input: Input, sender: Sender): Promise<void> {
  const [bundles, ctx] = await Promise.all([
    publishedBundles(),
    engineContext({ waId: chat.waId, name: chat.name }),
  ]);
  const registry = optionRegistry(chat.options);
  const tools: RenderTools = { register: registry.register, format: ctx.format, t: ctx.t };
  const actor = actorOf(chat);
  const session = sessionFor(chat.sessionId, chat.lastEventAt, ctx.now);
  // A delivered reminder leaves the queue whatever happens to it.
  const waiting =
    input.kind === 'push' ? chat.pending.filter((p) => p.id !== input.push.id) : chat.pending;
  const step = plan(input, chat, bundles);
  const outcome: Outcome = {
    demoKey: chat.demoKey,
    state: chat.state,
    contents: [],
    pending: waiting,
    events: session.started ? [{ type: 'SESSION_START', demoKey: chat.demoKey }] : [],
  };

  if (step.kind === 'picker') {
    outcome.contents.push(industryPicker(bundles, step.page, ctx.t));
  } else if (step.kind === 'start') {
    const bundle = bundles.find((b) => b.demo.key === step.demoKey);
    if (bundle) {
      const played = await play(
        bundle,
        newChatState(bundle.demo.key, chat.waId),
        { type: 'start' },
        ctx,
        { actor, sessionId: session.id },
      );
      Object.assign(outcome, {
        demoKey: bundle.demo.key,
        state: played.state,
        contents: played.contents,
        pending: played.scheduled,
      });
      outcome.events.push(
        { type: 'DEMO_OPENED', demoKey: bundle.demo.key },
        ...played.signals.map((s) => fromSignal(s, bundle.demo.key)),
      );
    } else {
      outcome.contents.push(industryPicker(bundles, 0, ctx.t));
    }
  } else if (step.kind === 'engine') {
    const key = step.bundle.demo.key;
    const state = chat.state ?? newChatState(key, chat.waId);
    const played = await play(step.bundle, state, step.event, ctx, {
      actor,
      sessionId: session.id,
    });
    Object.assign(outcome, {
      state: played.state,
      contents: played.contents,
      pending: [...waiting, ...played.scheduled],
    });
    outcome.events.push(...played.signals.map((s) => fromSignal(s, key)));
  }

  await deliver(sender, chat.waId, outcome.contents, tools);
  await saveChat(chat.id, {
    demoKey: outcome.demoKey,
    state: outcome.state,
    options: registry.entries(),
    pending: outcome.pending,
    sessionId: session.id,
    lastEventAt: new Date(ctx.now),
  });
  await recordChatEvents(actor, session.id, outcome.events);
}
