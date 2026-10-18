import { z } from 'zod';
import { E164_PHONE, PROVIDER_ACCOUNT_ID, TWILIO_ACCOUNT_SID } from '@exyconn/regex';
import {
  CrmCallProvider,
  type CrmCallConfigFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { tokenField } from '../secret';

export type CrmCallConfigRow = CrmCallConfigFieldsFragment;

/** Twilio calls the account id an Account SID; Vobiz calls it an Auth ID. */
export const accountLabel = (provider: CrmCallProvider) =>
  provider === CrmCallProvider.Twilio ? 'Account SID' : 'Auth ID';

export const makeCrmCallConfigSchema = (isEdit: boolean) =>
  z
    .object({
      label: z
        .string()
        .trim()
        .min(1, 'Give it a name')
        .max(80, 'Keep the name under 80 characters'),
      provider: z.enum(CrmCallProvider),
      fromNumber: z
        .string()
        .trim()
        .regex(E164_PHONE, 'Enter the number in international format, e.g. +14155550100'),
      accountId: z.string().trim(),
      authToken: tokenField(isEdit, 'Enter the auth token'),
      isActive: z.enum(['true', 'false']),
    })
    .superRefine((values, ctx) => {
      const pattern =
        values.provider === CrmCallProvider.Twilio ? TWILIO_ACCOUNT_SID : PROVIDER_ACCOUNT_ID;
      if (!pattern.test(values.accountId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountId'],
          message:
            values.provider === CrmCallProvider.Twilio
              ? 'A Twilio Account SID starts with AC, then 32 letters and digits'
              : 'Enter the Vobiz Auth ID',
        });
      }
    });

export type CrmCallConfigSchema = ReturnType<typeof makeCrmCallConfigSchema>;
export type CrmCallConfigValues = z.infer<CrmCallConfigSchema>;

export const toCrmCallConfigValues = (row: CrmCallConfigRow | null): CrmCallConfigValues => ({
  label: row?.label ?? '',
  provider: row?.provider ?? CrmCallProvider.Twilio,
  fromNumber: row?.fromNumber ?? '',
  accountId: row?.accountId ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored token.
  authToken: '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

export const toCrmCallConfigInput = ({ isActive, ...values }: CrmCallConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});
