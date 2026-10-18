import { z } from 'zod';
import { DOMAIN } from '@exyconn/regex';
import { CompanyStatus } from '@exyconn/shell/graphql/generated';
import { COMPANY_SIZES } from '../../crm.constants';
import {
  customDefaults,
  customFieldsSchema,
  toCustomInput,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import {
  emailPointSchema,
  emailPointsOf,
  pictureUrlSchema,
  profileDefaults,
  profileSchema,
} from '../../../../records/profile';
import type { CompanyRow } from './company.types';

/** A whole number typed into a text field: blank, or digits within the limit. */
const wholeNumber = (max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d+$/.test(value) && Number(value) <= max), message);

const baseSchema = profileSchema.extend({
  name: z.string().trim().min(1, 'Name is required'),
  logoUrl: pictureUrlSchema,
  /** A domain, not a URL — "exyconn.com", so two rows for one company are avoidable. */
  domain: z
    .string()
    .trim()
    .min(1, 'Domain is required')
    .regex(DOMAIN, 'Enter the domain on its own, e.g. exyconn.com'),
  emails: z.array(emailPointSchema),
  industry: z.string().trim(),
  /** Blank until somebody knows it. */
  size: z.union([z.literal(''), z.enum(COMPANY_SIZES)]),
  status: z.enum(CompanyStatus),
  location: z.string().trim(),
  annualRevenue: wholeNumber(1e15, 'Enter the revenue as a whole number'),
  employeeCount: wholeNumber(10_000_000, 'Enter the number of employees'),
  foundedYear: wholeNumber(new Date().getFullYear(), 'Enter a year like 2015'),
  /** Who looks after the account; blank until somebody takes it on. */
  owner: z.string().trim(),
  notes: z.string().trim(),
});

export const buildCompanySchema = (properties: readonly CustomPropertyDef[]) =>
  baseSchema.extend({ custom: customFieldsSchema(properties) });
export type CompanySchema = ReturnType<typeof buildCompanySchema>;
export type CompanyValues = z.infer<CompanySchema>;

const asText = (value: number | null | undefined) => (value == null ? '' : String(value));
const asNumber = (value: string) => (value === '' ? null : Number(value));

export const toCompanyValues = (
  row: CompanyRow | null,
  properties: readonly CustomPropertyDef[],
): CompanyValues => ({
  ...profileDefaults(row),
  name: row?.name ?? '',
  logoUrl: row?.logoUrl ?? '',
  domain: row?.domain ?? '',
  emails: emailPointsOf(row),
  industry: row?.industry ?? '',
  size: (row?.size as CompanyValues['size'] | undefined) ?? '',
  status: row?.status ?? CompanyStatus.Prospect,
  location: row?.location ?? '',
  annualRevenue: asText(row?.annualRevenue),
  employeeCount: asText(row?.employeeCount),
  foundedYear: asText(row?.foundedYear),
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
  custom: customDefaults(properties, row?.custom),
});

export const toCompanyInput = (
  values: CompanyValues,
  properties: readonly CustomPropertyDef[],
) => ({
  ...values,
  annualRevenue: asNumber(values.annualRevenue),
  employeeCount: asNumber(values.employeeCount),
  foundedYear: asNumber(values.foundedYear),
  custom: toCustomInput(properties, values.custom),
});
