import type { z } from 'zod';
import type { messageSchema } from './message.schema';

/** What the composer holds as it is typed. */
export type MessageInput = z.input<typeof messageSchema>;

/** What it sends — the body already trimmed. */
export type MessageValues = z.output<typeof messageSchema>;
