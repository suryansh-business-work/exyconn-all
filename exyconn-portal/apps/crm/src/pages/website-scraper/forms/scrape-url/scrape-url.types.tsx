import { z } from 'zod';
import { DOMAIN, HTTP_URL } from '@exyconn/regex';

/** A page address: a full http(s) URL, or a bare domain the server reads over https. */
export const scrapeUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Enter a website address')
    .max(2000, 'At most 2,000 characters')
    .refine(
      (value) => HTTP_URL.test(value) || DOMAIN.test(value),
      'Enter a website, e.g. example.com or https://example.com/about',
    ),
});

export type ScrapeUrlValues = z.infer<typeof scrapeUrlSchema>;
