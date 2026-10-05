import { z } from 'zod';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';

/** The limits the API enforces on a customer ticket (client-ticket.service.ts). */
export const openTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, 'One line about what is wrong')
    .max(120, 'Keep the title under 120 characters'),
  category: z.nativeEnum(SupportCategory),
  description: z
    .string()
    .trim()
    .min(20, 'A few sentences help us pick it up faster')
    .max(4000, 'Keep it under 4000 characters'),
  priority: z.nativeEnum(SupportPriority),
});

export type OpenTicketValues = z.infer<typeof openTicketSchema>;

export const OPEN_TICKET_DEFAULTS: OpenTicketValues = {
  subject: '',
  category: SupportCategory.Other,
  description: '',
  priority: SupportPriority.Medium,
};
