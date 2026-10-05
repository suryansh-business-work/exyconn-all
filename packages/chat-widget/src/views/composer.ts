import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { icons } from '../icons';
import { canRecord } from '../recorder';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import type { Channel } from '../types';
import { createAttach } from './attach';
import type { View } from './view';
import { createVoice } from './voice';

const MAX_BODY = 2000;
/** The counter appears once fewer characters than this are left. */
const COUNTER_FROM = 200;
const MAX_HEIGHT_PX = 140;

/**
 * Where the visitor writes: an autosizing box (Enter sends, Shift+Enter breaks the line),
 * and in the live chat — when uploads are allowed — pictures, clips and voice notes.
 */
export function createComposer(actions: Readonly<ChatActions>): View {
  let channel: Channel = 'LIVE';
  let canAttach = false;
  const attach = createAttach(actions);
  const voice = createVoice(
    (file) => actions.send('LIVE', '', [file]),
    (message) => actions.showError(message),
  );
  const box = h('textarea', {
    id: 'cw-message',
    class: 'cw-textarea',
    rows: 1,
    maxlength: MAX_BODY,
    placeholder: strings.placeholder,
  });
  const send = h('button', { type: 'submit', class: 'cw-send', 'aria-label': strings.send });
  send.append(icon(icons.send));
  const counter = h('p', { class: 'cw-counter', 'aria-live': 'polite', hidden: true });
  const extras = h('div', { class: 'cw-extras' }, attach.button, canRecord() ? voice.button : null);
  const el = h(
    'form',
    { class: 'cw-composer' },
    attach.previews,
    voice.bar,
    h(
      'div',
      { class: 'cw-compose-row' },
      extras,
      h('label', { for: 'cw-message', class: 'cw-sr' }, strings.messageLabel),
      box,
      send,
    ),
    counter,
    attach.input,
  );

  const resize = (): void => {
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight, MAX_HEIGHT_PX)}px`;
    const left = MAX_BODY - box.value.length;
    counter.hidden = left > COUNTER_FROM;
    counter.textContent = strings.charsLeft(left);
  };

  const submit = (): void => {
    const body = box.value.trim();
    const files = canAttach ? attach.files() : [];
    if (send.disabled || (body === '' && files.length === 0)) {
      return;
    }
    actions.send(channel, body, files);
    box.value = '';
    if (canAttach) {
      attach.clear();
    }
    resize();
  };

  on(el, 'submit', (event) => {
    event.preventDefault();
    submit();
  });
  on(box, 'keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit();
    }
  });
  on(box, 'input', () => {
    resize();
    if (channel === 'LIVE') {
      actions.typed();
    }
  });

  return {
    el,
    update(state: Readonly<ChatState>) {
      channel = state.tab === 'KNOWLEDGE' ? 'KNOWLEDGE' : 'LIVE';
      canAttach = channel === 'LIVE' && (state.config?.allowUploads ?? false);
      attach.setMaxMb(state.config?.maxUploadMb ?? 1);
      extras.hidden = !canAttach;
      attach.previews.classList.toggle('cw-off', !canAttach);
      send.disabled = state.connection !== 'open';
    },
  };
}
