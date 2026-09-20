import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';

/**
 * The same limits the API enforces (`client-ticket.service.ts`), written once here so the
 * form refuses first and the customer is not told "too short" after a round trip.
 */
export const raiseTicketSchema = z.object({
  requesterName: z
    .string()
    .trim()
    .min(2, 'Tell us who you are')
    .max(80, 'Keep the name under 80 characters'),
  requesterEmail: z
    .string()
    .trim()
    .min(1, 'We need an address to reply to')
    .regex(EMAIL, 'Enter a valid email'),
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

export const RAISE_TICKET_DEFAULTS = {
  requesterName: '',
  requesterEmail: '',
  subject: '',
  category: SupportCategory.Other,
  description: '',
  priority: SupportPriority.Medium,
};
