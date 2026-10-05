import { h, icon, isSafeUrl, on } from '../dom';
import { icons } from '../icons';
import type { ThreadItem } from '../store/state';
import { strings } from '../strings';
import { formatMessageTime } from '../time';
import type { ChatAttachment } from '../types';

function media(file: Readonly<ChatAttachment>): HTMLElement | null {
  if (!isSafeUrl(file.url)) {
    return null;
  }
  if (file.kind === 'VIDEO') {
    return h('video', { src: file.url, controls: true, preload: 'metadata', class: 'cw-media' });
  }
  if (file.kind === 'AUDIO') {
    return h('audio', {
      src: file.url,
      controls: true,
      preload: 'metadata',
      'aria-label': strings.voiceNote,
    });
  }
  const img = h('img', { src: file.url, alt: file.name, loading: 'lazy', class: 'cw-media' });
  // A data: preview cannot be opened in a tab; the stored copy can.
  if (file.url.startsWith('data:')) {
    return img;
  }
  return h('a', { href: file.url, target: '_blank', rel: 'noopener noreferrer' }, img);
}

function statusLine(item: Readonly<ThreadItem>, onRetry: () => void): HTMLElement {
  const time = h(
    'time',
    { datetime: item.message.createdAt },
    formatMessageTime(item.message.createdAt),
  );
  if (item.status === 'sending') {
    return h('p', { class: 'cw-meta' }, strings.sending);
  }
  if (item.status === 'failed') {
    const retry = h(
      'button',
      { type: 'button', class: 'cw-retry' },
      icon(icons.refresh),
      strings.retry,
    );
    on(retry, 'click', onRetry);
    return h('p', { class: 'cw-meta cw-failed' }, strings.failed, retry);
  }
  return h('p', { class: 'cw-meta' }, time);
}

const ROW_CLASS: Readonly<Record<string, string>> = {
  VISITOR: 'cw-row cw-from-visitor',
  SYSTEM: 'cw-row cw-from-system',
};

/** One message: visitor on the right, team or bot on the left with a name, notices centred. */
export function createBubble(
  item: Readonly<ThreadItem>,
  animateIn: boolean,
  onRetry: () => void,
): HTMLElement {
  const { message } = item;
  const rowClass = ROW_CLASS[message.sender] ?? 'cw-row cw-from-team';
  const row = h('div', { class: animateIn ? `${rowClass} cw-new` : rowClass });
  if (message.sender === 'SYSTEM') {
    row.append(h('p', { class: 'cw-system' }, message.body));
    return row;
  }
  if (message.sender !== 'VISITOR') {
    row.append(h('p', { class: 'cw-sender' }, message.senderName));
  }
  const bubble = h('div', { class: 'cw-bubble' });
  if (message.body) {
    bubble.append(h('p', { class: 'cw-body' }, message.body));
  }
  bubble.append(...message.attachments.map(media).filter((node) => node !== null));
  row.append(bubble, statusLine(item, onRetry));
  return row;
}
