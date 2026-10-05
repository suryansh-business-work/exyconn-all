import { dataUrlType, kindOf } from '../files';
import type { ThreadItem } from '../store/state';
import type { Channel, ChatAttachment, ClientFrame, OutgoingFile, VisitorSession } from '../types';

/** A per-message id the server echoes back, so the optimistic bubble can be swapped for it. */
function newClientId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // randomUUID needs a secure context; getRandomValues does not.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const previewOf = (file: Readonly<OutgoingFile>): ChatAttachment => ({
  url: file.data,
  name: file.name,
  kind: kindOf(dataUrlType(file.data)) ?? 'IMAGE',
  size: 0,
});

/** The visitor's bubble, shown at once while the server stores and echoes the message. */
export function optimisticItem(
  channel: Channel,
  body: string,
  files: OutgoingFile[],
  session: Readonly<VisitorSession> | null,
): ThreadItem {
  const key = newClientId();
  return {
    key,
    status: 'sending',
    files,
    message: {
      id: key,
      sessionId: session?.id ?? '',
      channel,
      sender: 'VISITOR',
      senderName: session?.name ?? '',
      body,
      attachments: files.map(previewOf),
      createdAt: new Date().toISOString(),
      readAt: null,
    },
  };
}

export function sendFrame(channel: Channel, item: Readonly<ThreadItem>): ClientFrame {
  return { t: 'send', clientId: item.key, channel, body: item.message.body, files: item.files };
}
