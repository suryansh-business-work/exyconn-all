import { z } from 'zod';
import type { ChatFileFrame } from '../../socket/chatSocket.types';

/** The server's limits on one reply (chat.validation.ts CHAT_LIMITS). */
export const CHAT_REPLY_LIMITS = { body: 2000, files: 4 } as const;

export const chatReplySchema = z.object({
  body: z.string().max(CHAT_REPLY_LIMITS.body, 'Keep the message under 2000 characters.'),
});

export type ChatReplyFormValues = z.infer<typeof chatReplySchema>;

/** A picture, clip or voice note attached to the reply being written. */
export interface ChatReplyFile extends ChatFileFrame {
  /** Stable key for the preview list. */
  id: string;
  size: number;
}

/** Sends one reply; false when it could not go, so the composer keeps what was written. */
export type SendChatReply = (body: string, files: ChatFileFrame[]) => boolean;
