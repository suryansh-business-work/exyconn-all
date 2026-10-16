import { z } from 'zod';
import { EMAIL, HTTP_URL, PHONE } from '@exyconn/regex';

/** What a contact point can be called; the first is what a new one starts as. */
export const POINT_LABELS = ['Work', 'Personal', 'Mobile', 'Home', 'Other'] as const;

const point = { label: z.string().trim().max(40, 'Keep the label short'), primary: z.boolean() };

export const emailPointSchema = z.object({
  address: z.string().trim().min(1, 'Enter the address').regex(EMAIL, 'Enter a valid email'),
  ...point,
});

export const phonePointSchema = z.object({
  number: z.string().trim().min(1, 'Enter the number').regex(PHONE, 'Enter a valid phone number'),
  ...point,
});

const urlOrBlank = z
  .string()
  .trim()
  .regex(HTTP_URL, 'Use a full address starting with https://')
  .or(z.literal(''));

/** The fields a contact and a company share: the lists, the web and where they are. */
export const profileSchema = z.object({
  phones: z.array(phonePointSchema),
  website: urlOrBlank,
  linkedinUrl: urlOrBlank,
  twitterUrl: urlOrBlank,
  address: z.string().trim().max(300, 'Keep the address under 300 characters'),
  city: z.string().trim().max(100, 'Too long'),
  country: z.string().trim(),
  timezone: z.string().trim(),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type EmailPointValues = z.infer<typeof emailPointSchema>;

interface ProfileRow {
  emails?: ReadonlyArray<{ address: string; label: string; primary: boolean }> | null;
  phones?: ReadonlyArray<{ number: string; label: string; primary: boolean }> | null;
  website?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  description?: string | null;
}

/** The record's addresses without the GraphQL __typename a fragment adds. */
export const emailPointsOf = (row: ProfileRow | null): EmailPointValues[] =>
  (row?.emails ?? []).map(({ address, label, primary }) => ({ address, label, primary }));

export const profileDefaults = (row: ProfileRow | null): ProfileValues => ({
  phones: (row?.phones ?? []).map(({ number, label, primary }) => ({ number, label, primary })),
  website: row?.website ?? '',
  linkedinUrl: row?.linkedinUrl ?? '',
  twitterUrl: row?.twitterUrl ?? '',
  address: row?.address ?? '',
  city: row?.city ?? '',
  country: row?.country ?? '',
  timezone: row?.timezone ?? '',
  description: row?.description ?? '',
});
