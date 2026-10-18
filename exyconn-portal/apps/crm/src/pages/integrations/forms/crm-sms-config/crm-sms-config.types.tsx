import { z } from 'zod';
import {
  DLT_SENDER_ID,
  E164_PHONE,
  SMS_TEMPLATE_ID,
  TEMPLATE_VARIABLE,
  TWILIO_ACCOUNT_SID,
} from '@exyconn/regex';
import { CrmSmsProvider, type CrmSmsConfigFieldsFragment } from '@exyconn/shell/graphql/generated';
import { tokenField } from '../secret';

export type CrmSmsConfigRow = CrmSmsConfigFieldsFragment;

/** One provider-specific field: the pattern it must match and what to say when it does not. */
interface FieldRule {
  field: 'fromNumber' | 'accountId' | 'senderId' | 'templateId' | 'messageVariable';
  pattern: RegExp;
  message: string;
}

const RULES: Record<CrmSmsProvider, readonly FieldRule[]> = {
  [CrmSmsProvider.Twilio]: [
    {
      field: 'accountId',
      pattern: TWILIO_ACCOUNT_SID,
      message: 'A Twilio Account SID starts with AC, then 32 letters and digits',
    },
    {
      field: 'fromNumber',
      pattern: E164_PHONE,
      message: 'Enter the number in international format, e.g. +14155550100',
    },
  ],
  [CrmSmsProvider.Msg91]: [
    { field: 'senderId', pattern: DLT_SENDER_ID, message: 'Enter the DLT sender id, e.g. EXYCON' },
    {
      field: 'templateId',
      pattern: SMS_TEMPLATE_ID,
      message: 'Enter the MSG91 flow template id',
    },
    {
      field: 'messageVariable',
      pattern: TEMPLATE_VARIABLE,
      message: 'Enter the template variable that carries the message, e.g. message',
    },
  ],
};

/** Only the chosen provider's fields are checked; the others are ignored and not sent. */
export const makeCrmSmsConfigSchema = (isEdit: boolean) =>
  z
    .object({
      label: z
        .string()
        .trim()
        .min(1, 'Give it a name')
        .max(80, 'Keep the name under 80 characters'),
      provider: z.enum(CrmSmsProvider),
      fromNumber: z.string().trim(),
      accountId: z.string().trim(),
      authToken: tokenField(isEdit, 'Enter the auth token or key'),
      senderId: z.string().trim(),
      templateId: z.string().trim(),
      messageVariable: z.string().trim(),
      isActive: z.enum(['true', 'false']),
    })
    .superRefine((values, ctx) => {
      for (const rule of RULES[values.provider]) {
        if (!rule.pattern.test(values[rule.field])) {
          ctx.addIssue({ code: 'custom', path: [rule.field], message: rule.message });
        }
      }
    });

export type CrmSmsConfigSchema = ReturnType<typeof makeCrmSmsConfigSchema>;
export type CrmSmsConfigValues = z.infer<CrmSmsConfigSchema>;

export const toCrmSmsConfigValues = (row: CrmSmsConfigRow | null): CrmSmsConfigValues => ({
  label: row?.label ?? '',
  provider: row?.provider ?? CrmSmsProvider.Twilio,
  fromNumber: row?.fromNumber ?? '',
  accountId: row?.accountId ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored token.
  authToken: '',
  senderId: row?.senderId ?? '',
  templateId: row?.templateId ?? '',
  messageVariable: row?.messageVariable || 'message',
  isActive: row?.isActive === false ? 'false' : 'true',
});

/** The input for the chosen provider: the other provider's fields are left out. */
export function toCrmSmsConfigInput(values: CrmSmsConfigValues) {
  const shared = {
    label: values.label,
    provider: values.provider,
    authToken: values.authToken,
    isActive: values.isActive === 'true',
  };
  if (values.provider === CrmSmsProvider.Twilio) {
    return { ...shared, fromNumber: values.fromNumber, accountId: values.accountId };
  }
  return {
    ...shared,
    senderId: values.senderId,
    templateId: values.templateId,
    messageVariable: values.messageVariable,
  };
}
