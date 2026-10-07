/**
 * Plays one scripted chat through a seed demo, the way a customer taps through it: open a
 * workflow from the menu, then pick options by id. Keeps the latest engine result so a test
 * can read what the bot sent and what it scheduled.
 */
import type { SeedDemo } from '../../../src/author';
import { newChatState, respond, type ChatEvent } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { DemoBundle, EngineContext } from '../../../src/engine/types';
import type { BotContent, ChatState, EngineResult, RenderedOption } from '../../../src/messages';
import { makeCtx } from '../engine/fixtures';
import { optionsOf } from './deep-explore-events';
import { bundleOf } from './harness';

export class SeedChat {
  private readonly bundle: DemoBundle;
  private readonly ctx: EngineContext;
  private state: ChatState;
  /** What the bot sent for the latest event. */
  contents: BotContent[] = [];
  result: EngineResult | undefined;

  constructor(seed: SeedDemo, ctx: EngineContext = makeCtx({ typingScale: 0 })) {
    this.bundle = bundleOf(seed);
    this.ctx = ctx;
    this.state = newChatState(seed.key, 'scripted');
  }

  /** Starts a workflow as if picked from the menu. */
  open(workflow: string): BotContent[] {
    return this.send({
      type: 'choice',
      option: {
        id: workflow,
        title: workflow,
        ref: { workflow: MENU, node: MENU, handle: workflow },
      },
      quoted: 'menu',
    });
  }

  /** Taps the option with this id from the bot's latest messages. */
  pick(id: string): BotContent[] {
    const option = this.options().find((o) => o.id === id);
    if (!option) {
      throw new Error(`No option "${id}" in the latest messages`);
    }
    return this.send({ type: 'choice', option, quoted: option.title });
  }

  /** Every option the bot's latest messages offer. */
  options(): RenderedOption[] {
    return this.contents.flatMap(optionsOf);
  }

  private send(event: ChatEvent): BotContent[] {
    const result = respond(this.bundle, this.state, event, this.ctx);
    this.result = result;
    this.state = result.state;
    this.contents = result.replies.map((r) => r.message.content as BotContent);
    return this.contents;
  }
}

/** Names of the contact cards among these messages. */
export function contactNames(contents: readonly BotContent[]): string[] {
  return contents.flatMap((c) => (c.type === 'contact' ? [c.contact.name] : []));
}

/** File names of the documents among these messages. */
export function documentNames(contents: readonly BotContent[]): string[] {
  return contents.flatMap((c) => (c.type === 'document' ? [c.document.fileName] : []));
}
