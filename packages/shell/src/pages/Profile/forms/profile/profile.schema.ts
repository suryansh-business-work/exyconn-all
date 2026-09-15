import { z } from 'zod';
import { HTTP_URL, PHONE } from '@exyconn/regex';
import { isValidLocale, isValidTimezone } from '@exyconn/i18n';

/** The API refuses a longer bio (see server profile-details.ts); the form says so first. */
export const BRIEF_MAX_LENGTH = 600;

/** An optional shared profile: empty, or a full web address. */
const optionalLink = z
  .string()
  .trim()
  .regex(HTTP_URL, 'Enter a full address starting with https://')
  .or(z.literal(''));

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(2, 'Minimum 2 characters'),
  phone: z.string().trim().regex(PHONE, 'Enter a valid phone number').or(z.literal('')),
  brief: z
    .string()
    .trim()
    .max(BRIEF_MAX_LENGTH, `Keep your bio under ${BRIEF_MAX_LENGTH} characters`),
  socialLinks: z.object({
    linkedin: optionalLink,
    github: optionalLink,
    twitter: optionalLink,
    website: optionalLink,
  }),
  // Empty means "follow the workspace default", which is a real answer, not a missing one.
  timezone: z
    .string()
    .refine((v) => v === '' || isValidTimezone(v), 'Choose a timezone from the list'),
  locale: z.string().refine((v) => v === '' || isValidLocale(v), 'Choose a language'),
});
