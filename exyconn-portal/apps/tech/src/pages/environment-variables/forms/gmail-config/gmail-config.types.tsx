import { z } from 'zod';
import type { GmailConfigFieldsFragment } from '@exyconn/shell/graphql/generated';

export type GmailConfigRow = GmailConfigFieldsFragment;

/** A Google OAuth client ID always ends with this. */
const CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

export const makeGmailSchema = (hasSecret: boolean) =>
  z
    .object({
      clientId: z
        .string()
        .trim()
        .max(300, 'That is too long for a client ID')
        .refine(
          (value) => value === '' || value.endsWith(CLIENT_ID_SUFFIX),
          `A Google client ID ends with ${CLIENT_ID_SUFFIX}`,
        ),
      clientSecret: z.string().trim().max(300, 'That is too long for a client secret'),
      enabled: z.boolean(),
    })
    .refine((v) => v.clientId !== '' || !v.enabled, {
      path: ['clientId'],
      message: 'Add the client ID before turning Gmail on',
    })
    .refine((v) => hasSecret || v.clientSecret !== '' || !v.enabled, {
      path: ['clientSecret'],
      message: 'Add the client secret before turning Gmail on',
    });

export type GmailFormValues = z.infer<ReturnType<typeof makeGmailSchema>>;

export const toGmailValues = (row: GmailConfigRow): GmailFormValues => ({
  clientId: row.clientId,
  clientSecret: '',
  enabled: row.enabled,
});
