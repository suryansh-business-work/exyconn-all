import { z } from 'zod';

export const SEND_TIMINGS = ['NOW', 'LATER'] as const;

export const campaignScheduleSchema = z
  .object({
    timing: z.enum(SEND_TIMINGS),
    scheduledAt: z.string().nullable(),
  })
  .refine((values) => values.timing === 'NOW' || Boolean(values.scheduledAt), {
    path: ['scheduledAt'],
    message: 'Choose when to send',
  })
  .refine(
    (values) => values.timing === 'NOW' || new Date(values.scheduledAt ?? 0).getTime() > Date.now(),
    {
      path: ['scheduledAt'],
      message: 'Choose a time in the future',
    },
  );

export type CampaignScheduleValues = z.infer<typeof campaignScheduleSchema>;
