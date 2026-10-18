import { z } from 'zod';
import type { MicrosoftMailConfigFieldsFragment } from '@exyconn/shell/graphql/generated';

export type MicrosoftMailConfigRow = MicrosoftMailConfigFieldsFragment;

/** The Entra tenant used when the field is left blank. */
export const DEFAULT_TENANT = 'common';

export const makeMicrosoftMailSchema = (hasSecret: boolean) =>
  z
    .object({
      clientId: z.string().trim().max(300, 'That is too long for a client ID'),
      clientSecret: z.string().trim().max(500, 'That is too long for a client secret'),
      tenant: z.string().trim().max(200, 'That is too long for a tenant'),
      enabled: z.boolean(),
    })
    .refine((v) => v.clientId !== '' || !v.enabled, {
      path: ['clientId'],
      message: 'Add the client ID before turning Microsoft Mail on',
    })
    .refine((v) => hasSecret || v.clientSecret !== '' || !v.enabled, {
      path: ['clientSecret'],
      message: 'Add the client secret before turning Microsoft Mail on',
    });

export type MicrosoftMailFormValues = z.infer<ReturnType<typeof makeMicrosoftMailSchema>>;

export const toMicrosoftMailValues = (row: MicrosoftMailConfigRow): MicrosoftMailFormValues => ({
  clientId: row.clientId,
  clientSecret: '',
  tenant: row.tenant || DEFAULT_TENANT,
  enabled: row.enabled,
});
