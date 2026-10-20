import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';

export const campaignTestSchema = z.object({
  to: z
    .string()
    .trim()
    .min(1, 'Enter the address to send the test to')
    .regex(EMAIL, 'Enter a valid email address'),
});

export type CampaignTestValues = z.infer<typeof campaignTestSchema>;
