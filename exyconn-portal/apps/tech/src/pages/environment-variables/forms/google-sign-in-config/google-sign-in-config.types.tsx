import { z } from 'zod';
import type { GoogleSignInConfigFieldsFragment } from '@exyconn/shell/graphql/generated';

export type GoogleSignInConfigRow = GoogleSignInConfigFieldsFragment;

/** A Google OAuth client ID always ends with this. */
const CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

/** Switching it on needs both halves; a stored secret counts, so blank keeps it. */
export const makeGoogleSignInSchema = (hasSecret: boolean) =>
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
    .refine((v) => !v.enabled || v.clientId !== '', {
      path: ['clientId'],
      message: 'Add the client ID before turning Google sign-in on',
    })
    .refine((v) => !v.enabled || hasSecret || v.clientSecret !== '', {
      path: ['clientSecret'],
      message: 'Add the client secret before turning Google sign-in on',
    });

export type GoogleSignInFormValues = z.infer<ReturnType<typeof makeGoogleSignInSchema>>;

/** The secret is never prefilled: the eye fetches it, and blank keeps it. */
export const toGoogleSignInValues = (row: GoogleSignInConfigRow): GoogleSignInFormValues => ({
  clientId: row.clientId,
  clientSecret: '',
  enabled: row.enabled,
});
