import { z } from 'zod';
import { EMAIL, HTTP_URL, PHONE, SLUG } from '@exyconn/regex';
import { businessSchema, demoSchema } from '@exyconn/wa-flow';

/** Optional contact fields: empty, or a value the pattern accepts. */
const optional = (pattern: RegExp, message: string) =>
  z.string().trim().regex(pattern, message).or(z.literal(''));

/**
 * `demoSchema` as stored, tightened where a person types: the key is a URL slug and the
 * business's phone, email and website must look like one (all from @exyconn/regex).
 */
export const demoProfileSchema = demoSchema.extend({
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .max(64, 'Keep the key under 64 characters')
    .regex(SLUG, 'Use lowercase letters, digits and hyphens only'),
  order: z.coerce.number<number>().int('Use a whole number').min(0, 'Use 0 or more'),
  business: businessSchema.extend({
    phone: optional(PHONE, 'Enter a valid phone number'),
    email: optional(EMAIL, 'Enter a valid email address'),
    website: optional(HTTP_URL, 'Enter a valid URL'),
  }),
});
