import type {
  BotContent,
  ChatState,
  EngineResult,
  EngineSignal,
  PendingPush,
} from '@exyconn/wa-flow';
import {
  respond,
  type ChatEvent,
  type DemoBundle,
  type EngineContext,
} from '@exyconn/wa-flow/engine';
import { parseAs } from '../whatsappDemo.parse';
import type { EventActor } from '../whatsappDemo.events';

/** One event played to the end: the AI read, when the engine asks for one, included. */
export interface Played {
  state: ChatState;
  contents: BotContent[];
  scheduled: PendingPush[];
  signals: EngineSignal[];
}

const botContents = (result: EngineResult): BotContent[] =>
  result.replies
    .filter((reply) => reply.message.from === 'bot')
    .map((reply) => reply.message.content as BotContent);

export async function play(
  bundle: DemoBundle,
  state: ChatState,
  event: ChatEvent,
  ctx: EngineContext,
  analytics: { actor: EventActor; sessionId: string },
): Promise<Played> {
  const first = respond(bundle, state, event, ctx);
  const played: Played = {
    state: first.state,
    contents: botContents(first),
    scheduled: first.scheduled,
    signals: first.signals,
  };
  if (!first.ai) {
    return played;
  }
  const request = first.ai;
  const parsed = await parseAs(analytics.actor, {
    sessionId: analytics.sessionId,
    demoKey: bundle.demo.key,
    ...request,
  });
  const result = parsed.ok ? { intent: parsed.intent, entities: parsed.entities } : null;
  const second = respond(bundle, first.state, { type: 'ai', request, result }, ctx);
  return {
    state: second.state,
    contents: [...played.contents, ...botContents(second)],
    scheduled: [...played.scheduled, ...second.scheduled],
    signals: [...played.signals, ...second.signals],
  };
}
