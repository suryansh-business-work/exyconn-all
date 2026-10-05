import type { ChatActions } from '../controller';
import { h, icon, on, setAttr } from '../dom';
import { icons } from '../icons';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import { IDS, type View } from './view';

export interface MenuView extends View {
  /** The gear button that opens the menu. */
  trigger: HTMLButtonElement;
  isOpen(): boolean;
  close(): void;
}

function menuItem(path: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = h('button', { type: 'button', class: 'cw-menu-item' }, icon(path), label);
  return on(button, 'click', onClick);
}

/**
 * The settings menu behind the gear: sound, download, end chat. Ending asks first, inside the
 * menu — never with a browser dialog.
 */
export function createMenu(actions: Readonly<ChatActions>): MenuView {
  const trigger = h('button', {
    type: 'button',
    class: 'cw-icon-button',
    'aria-label': strings.settings,
    'aria-controls': IDS.menu,
    'aria-expanded': 'false',
  });
  trigger.append(icon(icons.settings));

  const soundButton = h('button', {
    type: 'button',
    class: 'cw-menu-item',
    'aria-pressed': 'false',
  });
  const downloadButton = menuItem(icons.download, strings.download, () => {
    actions.download();
    close();
  });
  const endButton = menuItem(icons.power, strings.endChat, () => showConfirm(true));
  const items = h('div', { class: 'cw-menu-items' }, soundButton, downloadButton, endButton);

  const confirmYes = h(
    'button',
    { type: 'button', class: 'cw-button cw-danger' },
    strings.endConfirmYes,
  );
  const confirmNo = h('button', { type: 'button', class: 'cw-button cw-quiet' }, strings.cancel);
  const confirm = h(
    'div',
    { class: 'cw-confirm', role: 'group', 'aria-label': strings.endChat, hidden: true },
    h('p', {}, strings.endConfirm),
    h('div', { class: 'cw-row-actions' }, confirmNo, confirmYes),
  );
  const el = h('div', { id: IDS.menu, class: 'cw-menu', hidden: true }, items, confirm);

  function showConfirm(show: boolean): void {
    items.hidden = show;
    confirm.hidden = !show;
    (show ? confirmNo : endButton).focus();
  }
  function setOpen(open: boolean): void {
    el.hidden = !open;
    setAttr(trigger, 'aria-expanded', String(open));
    items.hidden = false;
    confirm.hidden = true;
  }
  function close(): void {
    setOpen(false);
    trigger.focus();
  }

  on(trigger, 'click', () => {
    const opening = el.hidden === true;
    setOpen(opening);
    if (opening) {
      soundButton.focus();
    }
  });
  on(soundButton, 'click', () => actions.toggleSound());
  on(confirmNo, 'click', () => showConfirm(false));
  on(confirmYes, 'click', () => {
    actions.endChat();
    close();
  });

  return {
    el,
    trigger,
    isOpen: () => !el.hidden,
    close,
    update(state: Readonly<ChatState>) {
      soundButton.replaceChildren(
        icon(state.soundOn ? icons.volumeOn : icons.volumeOff),
        state.soundOn ? strings.soundOn : strings.soundOff,
      );
      setAttr(soundButton, 'aria-pressed', String(state.soundOn));
      downloadButton.hidden = state.session === null;
      endButton.hidden = state.session?.status !== 'OPEN';
    },
  };
}
