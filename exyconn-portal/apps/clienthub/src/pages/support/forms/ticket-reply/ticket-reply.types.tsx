import { z } from 'zod';

export const ticketReplySchema = z.object({
  body: z.string().trim().min(1, 'Write a reply').max(5000, 'Keep it under 5000 characters'),
});

export type TicketReplyValues = z.infer<typeof ticketReplySchema>;
