import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { icons } from '../icons';
import { strings } from '../strings';

/** Shown instead of the composer once the chat is closed. */
export function createEnded(actions: Readonly<ChatActions>): HTMLElement {
  const restart = h('button', { type: 'button', class: 'cw-button cw-primary' }, strings.newChat);
  const download = h(
    'button',
    { type: 'button', class: 'cw-button cw-quiet' },
    icon(icons.download),
    strings.download,
  );
  on(restart, 'click', () => actions.newChat());
  on(download, 'click', () => actions.download());
  return h(
    'div',
    { class: 'cw-ended' },
    h('p', {}, strings.ended),
    h('div', { class: 'cw-row-actions' }, download, restart),
  );
}
