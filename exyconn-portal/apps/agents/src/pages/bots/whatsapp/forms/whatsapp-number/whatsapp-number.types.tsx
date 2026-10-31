import { z } from 'zod';
import { META_ID, PHONE } from '@exyconn/regex';
import type { WhatsappChannelQuery } from '@exyconn/shell/graphql/generated';

export type WhatsappChannelRow = NonNullable<WhatsappChannelQuery['whatsappChannel']['channel']>;

/**
 * The access token and app secret are write-only: required when the number is first
 * connected, blank on later saves keeps the stored ones.
 */
const secret = (isEdit: boolean, required: string, min: number, short: string) => {
  const typed = isEdit ? z.string().trim() : z.string().trim().min(1, required);
  return typed.refine((value) => value === '' || value.length >= min, short);
};

export const makeWhatsappNumberSchema = (isEdit: boolean) =>
  z.object({
    phoneNumberId: z
      .string()
      .trim()
      .min(1, 'Phone number ID is required')
      .regex(META_ID, 'Use the digits Meta shows as the Phone number ID'),
    displayPhone: z
      .string()
      .trim()
      .max(40, 'The number is too long')
      .refine((value) => value === '' || PHONE.test(value), 'Type the number as people dial it'),
    accessToken: secret(isEdit, 'Access token is required', 20, 'That access token is too short'),
    appSecret: secret(isEdit, 'App secret is required', 16, 'That app secret is too short'),
    verifyToken: z
      .string()
      .trim()
      .min(8, 'Use at least 8 characters')
      .max(128, 'Use at most 128 characters'),
    enabled: z.boolean(),
  });

export type WhatsappNumberSchema = ReturnType<typeof makeWhatsappNumberSchema>;
export type WhatsappNumberFormValues = z.infer<WhatsappNumberSchema>;

/** A fresh verify token for a first connection; any unguessable string Meta can echo. */
const newVerifyToken = () => globalThis.crypto.randomUUID().replaceAll('-', '');

export function toWhatsappNumberValues(row: WhatsappChannelRow | null): WhatsappNumberFormValues {
  return {
    phoneNumberId: row?.phoneNumberId ?? '',
    displayPhone: row?.displayPhone ?? '',
    // Never prefilled: the API does not return them, and blank keeps the stored ones.
    accessToken: '',
    appSecret: '',
    verifyToken: row?.verifyToken ?? newVerifyToken(),
    enabled: row?.enabled ?? true,
  };
}
