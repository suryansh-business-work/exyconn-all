import { z } from 'zod';
import { EMAIL, PHONE, isValidTaxId, normalizeTaxId } from '@exyconn/regex';
import { isValidCountry, normalizeCurrency } from '@exyconn/i18n';
import { gstStateCodeField } from '@exyconn/shell/utils/gstFields';
import {
  ClientStatus,
  ClientTaxIdType,
  type ClientInput,
  type ListClientsQuery,
} from '@exyconn/shell/graphql/generated';

export type ClientRow = ListClientsQuery['listClients'][number];

/** The country whose clients carry a GST state (the default place of supply). */
export const GST_COUNTRY = 'IN';

/** The server keeps region, city and postal code under this many characters. */
const TEXT_MAX = 120;

const shortText = z.string().trim().max(TEXT_MAX, 'Keep this under 120 characters');
const TAX_ID_CODES: ReadonlySet<string> = new Set(Object.values(ClientTaxIdType));

export const clientSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
    phone: z.string().trim().min(1, 'Phone is required').regex(PHONE, 'Enter a valid phone'),
    company: z.string().trim().min(1, 'Company is required'),
    status: z.enum(ClientStatus),
    country: z
      .string()
      .refine((code) => code === '' || isValidCountry(code), 'Choose a country from the list'),
    region: shortText,
    city: shortText,
    postalCode: shortText,
    billingAddress: z.string().trim(),
    taxIdType: z
      .string()
      .refine((code) => code === '' || TAX_ID_CODES.has(code), 'Choose a tax number type'),
    taxId: z.string().trim(),
    stateCode: gstStateCodeField,
    currency: z
      .string()
      .refine((code) => code === '' || normalizeCurrency(code) !== null, 'Choose a currency'),
    projectIds: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.taxId !== '' && values.taxIdType === '') {
      ctx.addIssue({ code: 'custom', path: ['taxIdType'], message: 'Choose a tax number type' });
    }
    if (values.taxId !== '' && values.taxIdType !== '') {
      if (!isValidTaxId(values.taxIdType, values.taxId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['taxId'],
          message: 'Enter the tax number in the format shown in the hint',
        });
      }
    }
    if (values.stateCode !== '' && values.country !== GST_COUNTRY) {
      ctx.addIssue({
        code: 'custom',
        path: ['stateCode'],
        message: 'A GST state applies to Indian clients only',
      });
    }
  });

export type ClientFormValues = z.infer<typeof clientSchema>;

export const toClientValues = (row: ClientRow | null, projectIds: string[]): ClientFormValues => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  phone: row?.phone ?? '',
  company: row?.company ?? '',
  status: row?.status ?? ClientStatus.Prospect,
  country: row?.country ?? '',
  region: row?.region ?? '',
  city: row?.city ?? '',
  postalCode: row?.postalCode ?? '',
  billingAddress: row?.billingAddress ?? '',
  taxIdType: row?.taxIdType ?? '',
  taxId: row?.taxId ?? '',
  stateCode: row?.stateCode ?? '',
  currency: row?.currency ?? '',
  projectIds,
});

/** What the API takes: the tax number normalised and paired with its kind, or neither. */
export function toClientInput(values: ClientFormValues): ClientInput {
  const taxId = normalizeTaxId(values.taxId);
  return {
    name: values.name,
    email: values.email,
    phone: values.phone,
    company: values.company,
    status: values.status,
    country: values.country,
    region: values.region,
    city: values.city,
    postalCode: values.postalCode,
    billingAddress: values.billingAddress,
    taxIdType: taxId === '' ? null : (values.taxIdType as ClientTaxIdType),
    taxId,
    stateCode: values.country === GST_COUNTRY ? values.stateCode : '',
    currency: values.currency,
  };
}
