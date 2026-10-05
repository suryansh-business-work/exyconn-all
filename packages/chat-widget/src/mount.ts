import { createController } from './controller';
import { h } from './dom';
import { createStore, initialState, type ChatState } from './store/state';
import { buildStyles } from './styles';
import { themeDeclarations, type ChatTheme } from './tokens';
import type { ChatSite } from './types';
import { createLauncher } from './views/launcher';
import { createPanel } from './views/panel';

export interface ChatWidgetOptions {
  /** The portal API's chat socket, e.g. wss://portal-server.exyconn.com/chat/ws. */
  socketUrl: string;
  site: ChatSite;
  theme?: Partial<ChatTheme>;
  /** Linked from the sign-in form. */
  privacyUrl?: string;
}

/**
 * Mounts the chat bubble in the page's bottom-right corner, inside its own Shadow DOM so the
 * page's CSS and the widget's cannot touch each other. Returns a function that removes it.
 * Browser only: call it from client code, never during a server render.
 */
export function mountChatWidget(options: Readonly<ChatWidgetOptions>): () => void {
  const host = h('div', { 'data-exyconn-chat': '' });
  const root = host.attachShadow({ mode: 'open' });
  root.append(h('style', {}, buildStyles(themeDeclarations(options.theme))));

  const store = createStore(initialState(false));
  // The panel announces through its live region; it is built right after the controller.
  let announce: (text: string) => void = () => undefined;
  const controller = createController(
    store,
    { socketUrl: options.socketUrl, site: options.site, root },
    (text) => announce(text),
  );
  const launcher = createLauncher(controller.actions);
  const panel = createPanel(controller.actions, options.privacyUrl);
  announce = panel.announce;
  root.append(panel.el, launcher.el);

  const render = (state: ChatState, previous: ChatState): void => {
    launcher.update(state, previous);
    panel.update(state, previous);
    if (state.open && !previous.open) {
      requestAnimationFrame(() => panel.focusFirst());
    }
    if (!state.open && previous.open && panel.el.contains(root.activeElement)) {
      launcher.el.focus();
    }
  };
  const unsubscribe = store.subscribe(render);
  render(store.get(), store.get());
  document.body.append(host);

  return () => {
    unsubscribe();
    controller.dispose();
    host.remove();
  };
}
