import { z } from 'zod';
import { GOOGLE_MEET_URL } from '@exyconn/regex';

/** The call the bot joins, and the visitor's agreement to the recording terms. */
export const meetingBotTripSchema = z.object({
  meetUrl: z
    .string()
    .trim()
    .min(1, 'Paste the Google Meet link')
    .max(300, 'At most 300 characters')
    .regex(GOOGLE_MEET_URL, 'Use a Google Meet link, like https://meet.google.com/abc-defg-hij'),
  consent: z.boolean().refine((agreed) => agreed, 'Agree to the recording terms to send the bot'),
});

export type MeetingBotTripValues = z.infer<typeof meetingBotTripSchema>;
