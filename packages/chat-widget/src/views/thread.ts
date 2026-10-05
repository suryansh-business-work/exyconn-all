import { h, syncChildren } from '../dom';
import type { ChatState, ThreadItem } from '../store/state';
import { strings } from '../strings';
import type { Channel } from '../types';
import { createBubble } from './bubble';
import type { View } from './view';

/** How close to the bottom still counts as "reading the newest", in px. */
const STICK_PX = 80;

const signatureOf = (item: Readonly<ThreadItem>): string => item.status + '|' + item.message.id;

function lastVisitorRead(items: readonly ThreadItem[]): ThreadItem | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.message.sender === 'VISITOR' && item.status === 'sent') {
      return item.message.readAt ? item : undefined;
    }
  }
  return undefined;
}

function typingRow(): { el: HTMLElement; label: HTMLElement } {
  const label = h('span', {});
  const dots = h('span', { class: 'cw-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  return { el: h('div', { class: 'cw-typing', role: 'status' }, label, dots), label };
}

/**
 * One thread's bubbles. Rendered by key so an existing bubble (and a voice note playing in it)
 * is never rebuilt; only new keys are created, and only those slide in.
 */
export function createThread(channel: Channel, onRetry: (key: string) => void): View {
  const el = h('div', { class: 'cw-thread', tabindex: 0, 'aria-label': strings.conversation });
  const welcome = h('div', { class: 'cw-welcome' });
  const seen = h('p', { class: 'cw-seen' }, strings.seen);
  const typing = typingRow();
  const cache = new Map<string, { signature: string; node: HTMLElement }>();
  let rendered = false;

  const nodeFor = (item: Readonly<ThreadItem>): HTMLElement => {
    const signature = signatureOf(item);
    const cached = cache.get(item.key);
    if (cached?.signature === signature) {
      return cached.node;
    }
    const node = createBubble(item, rendered && !cached, () => onRetry(item.key));
    cache.set(item.key, { signature, node });
    return node;
  };

  return {
    el,
    update(state: Readonly<ChatState>, previous: Readonly<ChatState>) {
      const items = state.threads[channel];
      const changed =
        !rendered ||
        items !== previous.threads[channel] ||
        state.typing[channel] !== previous.typing[channel] ||
        state.config !== previous.config;
      if (!changed) {
        return;
      }
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
      const welcomeText =
        channel === 'LIVE' ? (state.config?.welcomeMessage ?? '') : strings.welcomeKnowledge;
      welcome.textContent = welcomeText;
      const nodes: Node[] = items.length === 0 ? [welcome] : items.map(nodeFor);
      const read = channel === 'LIVE' ? lastVisitorRead(items) : undefined;
      if (read) {
        nodes.splice(items.indexOf(read) + 1, 0, seen);
      }
      if (state.typing[channel]) {
        typing.label.textContent = strings.typing(state.typing[channel]);
        nodes.push(typing.el);
      }
      const keys = new Set(items.map((item) => item.key));
      [...cache.keys()].filter((key) => !keys.has(key)).forEach((key) => cache.delete(key));
      syncChildren(el, nodes);
      const ownNew =
        items.at(-1)?.message.sender === 'VISITOR' &&
        items.length > previous.threads[channel].length;
      if (!rendered || nearBottom || ownNew) {
        el.scrollTop = el.scrollHeight;
      }
      rendered = true;
    },
  };
}
