import { z } from 'zod';
import { E164_PHONE } from '@exyconn/regex';
import { recipientField } from '../recipient';

export const startCallSchema = z.object({
  to: recipientField,
  agentPhone: z
    .string()
    .trim()
    .min(1, 'Enter your phone number')
    .regex(E164_PHONE, 'Enter your number in international format, e.g. +14155550100'),
});

export type StartCallValues = z.infer<typeof startCallSchema>;
