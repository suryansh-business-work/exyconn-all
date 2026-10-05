import type { ChatMessageDocument, ChatSessionDocument } from './models';

type WithMeta<T> = T & { _id: unknown; createdAt: Date; updatedAt: Date };

/** A message as both the widget and the console read it. */
export function toMessage(doc: WithMeta<ChatMessageDocument>) {
  return {
    id: String(doc._id),
    sessionId: doc.sessionId,
    channel: doc.channel,
    sender: doc.sender,
    senderName: doc.senderName,
    body: doc.body,
    attachments: doc.attachments.map(({ url, name, kind, size }) => ({ url, name, kind, size })),
    createdAt: doc.createdAt,
    readAt: doc.readAt ?? null,
  };
}

/** What the visitor's widget knows about its own session. */
export function toVisitorSession(doc: WithMeta<ChatSessionDocument>) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    status: doc.status,
    ticketReference: doc.ticketReference,
    createdAt: doc.createdAt,
    closedAt: doc.closedAt ?? null,
  };
}

/** A session as the console lists it: everything but the pass's token version. */
export function toStaffSession(doc: WithMeta<ChatSessionDocument>) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    site: doc.site,
    pageUrl: doc.pageUrl,
    status: doc.status,
    ticketId: doc.ticketId,
    ticketReference: doc.ticketReference,
    assigneeId: doc.assigneeId,
    assigneeName: doc.assigneeName,
    lastMessageAt: doc.lastMessageAt ?? null,
    lastMessagePreview: doc.lastMessagePreview,
    lastSender: doc.lastSender ?? '',
    staffUnread: doc.staffUnread,
    messageCount: doc.messageCount,
    awaitingReplySince: doc.awaitingReplySince ?? null,
    handedOffAt: doc.handedOffAt ?? null,
    closedAt: doc.closedAt ?? null,
    closedBy: doc.closedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
