import type { ChatActions } from '../controller';
import { animate, h, icon, on, setAttr } from '../dom';
import { icons } from '../icons';
import { strings } from '../strings';
import { IDS, type View } from './view';

const BUMP: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.14) translateY(-4px)' },
  { transform: 'scale(0.96)' },
  { transform: 'scale(1)' },
];

/** The round button in the corner: opens and closes the panel, shows the unread count. */
export function createLauncher(actions: Readonly<ChatActions>): View<HTMLButtonElement> {
  const badge = h('span', { class: 'cw-badge', 'aria-hidden': 'true', hidden: true });
  const openIcon = icon(icons.chat);
  const closeIcon = icon(icons.close);
  const el = h(
    'button',
    { type: 'button', class: 'cw-launcher', 'aria-controls': IDS.panel, 'aria-expanded': 'false' },
    openIcon,
    badge,
  );
  on(el, 'click', () => {
    if (el.getAttribute('aria-expanded') === 'true') {
      actions.close();
    } else {
      actions.open();
    }
  });

  return {
    el,
    update(state, previous) {
      el.hidden = state.config?.enabled === false;
      setAttr(el, 'aria-expanded', String(state.open));
      const label = state.open ? strings.closeChat : strings.openChat;
      const unread = state.unread > 0 ? `, ${strings.unread(state.unread)}` : '';
      setAttr(el, 'aria-label', label + unread);
      el.firstElementChild?.replaceWith(state.open ? closeIcon : openIcon);
      badge.hidden = state.unread === 0;
      badge.textContent = state.unread > 9 ? '9+' : String(state.unread);
      if (state.unread > previous.unread) {
        animate(el, BUMP, 650);
      }
    },
  };
}
