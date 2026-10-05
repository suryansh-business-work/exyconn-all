import type { ChatActions } from '../controller';
import { animate, h, icon, on, setAttr } from '../dom';
import { icons } from '../icons';
import type { ChatState, Connection } from '../store/state';
import { strings } from '../strings';
import { createChat } from './chat';
import { createFaqs } from './faqs';
import { createHeader } from './header';
import { createMenu } from './menu';
import { createSignIn } from './signin';
import { createTabs } from './tabs';
import { IDS, type View } from './view';

export interface PanelView extends View {
  /** Moves focus into the panel (the selected tab). */
  focusFirst(): void;
  announce(text: string): void;
}

const SWITCH: Keyframe[] = [
  { opacity: 0, transform: 'translateX(24px)' },
  { opacity: 1, transform: 'translateX(0)' },
];

const CONNECTION_TEXT: Readonly<Record<Connection, string>> = {
  idle: strings.connecting,
  connecting: strings.connecting,
  reconnecting: strings.reconnecting,
  open: '',
};

/** The chat window: header, tabs, banners, and the selected section. */
export function createPanel(actions: Readonly<ChatActions>, privacyUrl?: string): PanelView {
  const menu = createMenu(actions);
  const header = createHeader(actions, menu);
  const tabs = createTabs(actions);
  const faqs = createFaqs(actions);
  const signIn = createSignIn(actions, privacyUrl);
  const chat = createChat(actions);
  const connection = h('p', { class: 'cw-connection', role: 'status' });
  const errorText = h('span', {});
  const dismiss = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.dismiss,
  });
  dismiss.append(icon(icons.close));
  on(dismiss, 'click', () => actions.dismissError());
  const error = h('div', { class: 'cw-error', role: 'alert', hidden: true }, errorText, dismiss);
  const tabpanel = h(
    'div',
    { id: IDS.tabpanel, role: 'tabpanel', class: 'cw-tabpanel' },
    faqs.el,
    signIn.el,
    chat.el,
  );
  const live = h('div', { class: 'cw-sr', 'aria-live': 'polite' });
  const el = h(
    'div',
    {
      id: IDS.panel,
      class: 'cw-panel',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': IDS.title,
    },
    header.el,
    tabs.el,
    connection,
    error,
    tabpanel,
    live,
  );

  on(el, 'keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    event.stopPropagation();
    if (menu.isOpen()) {
      menu.close();
    } else {
      actions.close();
    }
  });

  return {
    el,
    focusFirst: () => tabs.focusActive(),
    announce(text) {
      live.textContent = text;
    },
    update(state: Readonly<ChatState>, previous: Readonly<ChatState>) {
      el.classList.toggle('cw-open', state.open);
      setAttr(el, 'aria-hidden', state.open ? undefined : 'true');
      connection.hidden = state.connection === 'open';
      connection.textContent = CONNECTION_TEXT[state.connection];
      error.hidden = state.error === '';
      errorText.textContent = state.error;
      setAttr(tabpanel, 'aria-labelledby', IDS.tab(state.tab));
      const onFaqs = state.tab === 'FAQS';
      faqs.el.hidden = !onFaqs;
      signIn.el.hidden = onFaqs || state.step === 'signedIn';
      chat.el.hidden = onFaqs || state.step !== 'signedIn';
      header.update(state, previous);
      menu.update(state, previous);
      tabs.update(state, previous);
      faqs.update(state, previous);
      signIn.update(state, previous);
      chat.update(state, previous);
      if (state.tab !== previous.tab || (state.open && !previous.open)) {
        chat.scrollToEnd();
      }
      if (state.switches > previous.switches) {
        animate(tabpanel, SWITCH, 350);
      }
    },
  };
}
