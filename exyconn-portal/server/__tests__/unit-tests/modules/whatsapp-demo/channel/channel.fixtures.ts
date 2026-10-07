import type { OptionRef, RenderedOption } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import type { ChatRecord } from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';

/**
 * Just enough of a published industry for the channel's own code, which reads only the demo's
 * key, industry and business name; the engine itself is not run by these suites.
 */
export function demoBundle(key: string, industry = key, businessName = `${industry} Co`) {
  const bundle: unknown = {
    demo: { key, industry, business: { name: businessName } },
    workflows: [],
  };
  return bundle as DemoBundle;
}

/** An engine option, pointing at a node of a workflow. */
export function option(id: string, ref: Partial<OptionRef> = {}, title = id): RenderedOption {
  return { id, title, ref: { workflow: 'booking', node: 'start', handle: id, ...ref } };
}

/** A chat as the conversation reads it, with nothing stored yet. */
export function chatRecord(overrides: Partial<ChatRecord> = {}): ChatRecord {
  return {
    id: 'chat-1',
    waId: '919800000001',
    name: 'Asha Rao',
    demoKey: null,
    state: null,
    options: {},
    pending: [],
    sessionId: null,
    lastEventAt: null,
    ...overrides,
  };
}
