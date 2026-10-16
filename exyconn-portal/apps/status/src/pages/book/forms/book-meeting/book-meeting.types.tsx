import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import type { BookMeetingMutation } from '@exyconn/shell/graphql/generated';

export const bookMeetingSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(120, 'Keep your name under 120 characters'),
  email: z.string().trim().min(1, 'Enter your email').regex(EMAIL, 'Enter a valid email'),
  notes: z.string().trim().max(2000, 'Keep it under 2000 characters'),
});

export type BookMeetingValues = z.infer<typeof bookMeetingSchema>;
export type BookedMeeting = BookMeetingMutation['bookMeeting'];
