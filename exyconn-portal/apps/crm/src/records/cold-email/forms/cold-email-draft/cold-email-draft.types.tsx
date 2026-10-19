import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { ColdEmailTone } from '@exyconn/shell/graphql/generated';

export const MAX_GOAL_CHARS = 1000;

export const coldEmailDraftSchema = z.object({
  /** One of the record's addresses. */
  toEmail: z.string().trim().min(1, 'Choose who it goes to').regex(EMAIL, 'Choose a valid address'),
  /** What we are offering; blank introduces the company. */
  goal: z
    .string()
    .trim()
    .max(MAX_GOAL_CHARS, `Keep what you are offering under ${MAX_GOAL_CHARS} characters`),
  tone: z.enum(ColdEmailTone),
  /** Read their website through Firecrawl first. */
  readWebsite: z.boolean(),
});

export type ColdEmailDraftValues = z.infer<typeof coldEmailDraftSchema>;

/** The contact or company the cold email is for, with what the form needs from it. */
export interface ColdEmailDraftTarget {
  object: 'CONTACT' | 'COMPANY';
  id: string;
  name: string;
  emails: string[];
  /** Their website, empty when the record has none. */
  website: string;
}
