import { z } from 'zod';
import { HOSTNAME } from '@exyconn/regex';
import type { EmailVerifierConfigsQuery } from '@exyconn/shell/graphql/generated';

export type EmailVerifierConfigRow = EmailVerifierConfigsQuery['emailVerifierConfigs'][number];

/** The proxy is optional (empty host = no proxy); a password is write-only, blank keeps it. */
export const emailVerifierConfigSchema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  proxyHost: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || HOSTNAME.test(value),
      'Enter a host name, e.g. proxy.example.com',
    ),
  proxyPort: z.coerce.number().int().min(1, 'Port is 1–65535').max(65535, 'Port is 1–65535'),
  proxyUsername: z.string().trim().max(200),
  proxyPassword: z.string().trim().max(200),
  isActive: z.enum(['true', 'false']),
});

export type EmailVerifierConfigValues = z.infer<typeof emailVerifierConfigSchema>;
