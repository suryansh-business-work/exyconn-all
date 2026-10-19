import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import {
  SuppressionReason,
  type MarketingSuppressionFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type SuppressionRow = MarketingSuppressionFieldsFragment;

export const MAX_NOTE = 500;

export const suppressionSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email address'),
  reason: z.enum(SuppressionReason),
  note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters`),
  archived: z.boolean(),
});

export type SuppressionFormValues = z.infer<typeof suppressionSchema>;

export const EMPTY_SUPPRESSION: SuppressionFormValues = {
  email: '',
  reason: SuppressionReason.Manual,
  note: '',
  archived: false,
};

/** Each reason with what it should only be used for. English labels are translation keys. */
export const REASON_OPTIONS: ReadonlyArray<{
  value: SuppressionReason;
  label: string;
  hint: string;
}> = [
  {
    value: SuppressionReason.Manual,
    label: 'Manual',
    hint: 'Your team decided not to email this address.',
  },
  {
    value: SuppressionReason.Unsubscribed,
    label: 'Unsubscribed',
    hint: 'The person asked to stop receiving marketing, e.g. by phone or email.',
  },
  {
    value: SuppressionReason.Bounced,
    label: 'Hard bounce',
    hint: 'Mail to this address was permanently rejected.',
  },
  {
    value: SuppressionReason.SpamComplaint,
    label: 'Spam complaint',
    hint: 'The person reported one of your emails as spam.',
  },
  {
    value: SuppressionReason.DoNotContact,
    label: 'Do not contact',
    hint: 'A legal, contractual or account-level instruction not to contact them.',
  },
  { value: SuppressionReason.Other, label: 'Other', hint: 'Explain why in the note.' },
];
