import { z } from 'zod';
import { recipientField } from '../recipient';

/** The most an SMS from the CRM may carry, as the server allows. */
export const MAX_SMS_LENGTH = 1000;

export const sendSmsSchema = z.object({
  to: recipientField,
  body: z
    .string()
    .trim()
    .min(1, 'Write the message')
    .max(MAX_SMS_LENGTH, 'Keep the message under 1000 characters'),
});

export type SendSmsValues = z.infer<typeof sendSmsSchema>;
