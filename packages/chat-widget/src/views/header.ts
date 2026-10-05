import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { icons } from '../icons';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import type { MenuView } from './menu';
import { IDS, type View } from './view';

/** The bot's name, whether the team is online, the gear menu and minimise. */
export function createHeader(actions: Readonly<ChatActions>, menu: Readonly<MenuView>): View {
  const title = h('h2', { id: IDS.title, class: 'cw-title' }, strings.defaultTitle);
  const dot = h('span', { class: 'cw-dot', 'aria-hidden': 'true' });
  const statusText = h('span', {}, strings.offline);
  const minimise = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.minimise,
  });
  minimise.append(icon(icons.minimise));
  on(minimise, 'click', () => actions.close());

  const el = h(
    'header',
    { class: 'cw-header' },
    h('div', { class: 'cw-heading' }, title, h('p', { class: 'cw-status' }, dot, statusText)),
    h('div', { class: 'cw-header-actions' }, menu.trigger, minimise),
    menu.el,
  );

  return {
    el,
    update(state: Readonly<ChatState>) {
      title.textContent = state.config?.botName ?? strings.defaultTitle;
      const online = state.config?.online ?? false;
      dot.classList.toggle('cw-online', online);
      statusText.textContent = online ? strings.online : strings.offline;
    },
  };
}
