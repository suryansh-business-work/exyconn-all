import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { icons } from '../icons';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import { createComposer } from './composer';
import { createEnded } from './ended';
import { createThread } from './thread';
import type { View } from './view';

export interface ChatView extends View {
  /** Shows the newest message of the visible thread (after the thread was hidden). */
  scrollToEnd(): void;
}

/** A signed-in visitor's two threads, the offline/switch banners, and the composer. */
export function createChat(actions: Readonly<ChatActions>): ChatView {
  const live = createThread('LIVE', (key) => actions.retry('LIVE', key));
  const knowledge = createThread('KNOWLEDGE', (key) => actions.retry('KNOWLEDGE', key));
  const offline = h('p', { class: 'cw-banner', role: 'status', hidden: true });
  const noticeText = h('span', {});
  const dismiss = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.dismiss,
  });
  dismiss.append(icon(icons.close));
  on(dismiss, 'click', () => actions.dismissNotice());
  const notice = h(
    'div',
    { class: 'cw-banner cw-notice', role: 'status', hidden: true },
    noticeText,
    dismiss,
  );
  const composer = createComposer(actions);
  const ended = createEnded(actions);
  const el = h(
    'div',
    { class: 'cw-chat' },
    offline,
    notice,
    live.el,
    knowledge.el,
    composer.el,
    ended,
  );

  return {
    el,
    scrollToEnd() {
      const thread = live.el.hidden ? knowledge.el : live.el;
      thread.scrollTop = thread.scrollHeight;
    },
    update(state: Readonly<ChatState>, previous: Readonly<ChatState>) {
      const isLive = state.tab === 'LIVE';
      live.el.hidden = !isLive;
      knowledge.el.hidden = isLive;
      offline.hidden = !isLive || (state.config?.online ?? true);
      offline.textContent = state.config?.offlineMessage ?? '';
      notice.hidden = isLive || state.notice === '';
      noticeText.textContent = state.notice;
      const closed = state.session?.status === 'CLOSED';
      composer.el.hidden = closed;
      ended.hidden = !closed;
      live.update(state, previous);
      knowledge.update(state, previous);
      composer.update(state, previous);
    },
  };
}
