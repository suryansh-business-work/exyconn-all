import { z } from 'zod';
import { EMAIL, HTTP_URL, SLUG } from '@exyconn/regex';
import { Role, TaxSystem } from '@/graphql/generated';
import { currencyField } from '@/utils/currencyField';
import type { OrganizationRow } from './organization.types';

/** An optional free-text detail, kept under `max` characters. */
const detail = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

const optionalLink = z
  .string()
  .trim()
  .regex(HTTP_URL, 'Enter a full link starting with https://')
  .or(z.literal(''));

const member = z.object({
  name: z.string().trim().min(2, 'Enter their name').max(120, 'Keep the name under 120 characters'),
  email: z.string().trim().regex(EMAIL, 'Enter a valid email'),
  roles: z.array(z.enum(Role)).min(1, 'Pick at least one portal'),
});

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(120, 'Keep the name under 120 characters'),
  slug: z
    .string()
    .trim()
    .regex(SLUG, 'Use lowercase letters, digits and dashes')
    .max(60, 'Keep the handle under 60 characters')
    .or(z.literal('')),
  legalName: detail(200),
  industry: detail(120),
  companySize: z.string(),
  description: detail(2000),
  contactEmail: z.string().trim().regex(EMAIL, 'Enter a valid email').or(z.literal('')),
  phone: detail(40),
  website: optionalLink,
  addressLine1: detail(200),
  addressLine2: detail(200),
  city: detail(120),
  region: detail(120),
  postalCode: detail(20),
  country: z.string().trim().length(2, 'Pick a country from the list').or(z.literal('')),
  currency: currencyField,
  locale: z.string().trim().min(2, 'Pick the language its portal reads in'),
  timezone: z.string().trim().min(1, 'Pick the timezone it works by'),
  // A select hands back its option's value as text; it becomes a number on the way out.
  fiscalYearStartMonth: z.string().regex(/^([1-9]|1[0-2])$/, 'Pick a month'),
  taxSystem: z.enum(TaxSystem),
  registrationNumber: detail(60),
  taxId: detail(60),
  // Filled by the upload dialog with the hosted ImageKit address; optional.
  logoUrl: z.string().trim().regex(HTTP_URL, 'Upload the logo again').or(z.literal('')),
  /** People to invite once the company exists (creation only). */
  members: z.array(member),
});
export type OrganizationValues = z.infer<typeof organizationSchema>;

export const toInitial = (row: OrganizationRow | null): OrganizationValues => ({
  name: row?.name ?? '',
  slug: row?.slug ?? '',
  legalName: row?.legalName ?? '',
  industry: row?.industry ?? '',
  companySize: row?.companySize ?? '',
  description: row?.description ?? '',
  contactEmail: row?.contactEmail ?? '',
  phone: row?.phone ?? '',
  website: row?.website ?? '',
  addressLine1: row?.addressLine1 ?? '',
  addressLine2: row?.addressLine2 ?? '',
  city: row?.city ?? '',
  region: row?.region ?? '',
  postalCode: row?.postalCode ?? '',
  country: row?.country ?? '',
  currency: row?.currency ?? '',
  locale: row?.locale ?? 'en',
  timezone: row?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  fiscalYearStartMonth: String(row?.fiscalYearStartMonth ?? 1),
  taxSystem: row?.taxSystem ?? TaxSystem.None,
  registrationNumber: row?.registrationNumber ?? '',
  taxId: row?.taxId ?? '',
  logoUrl: row?.logoUrl ?? '',
  members: [],
});

/** Everything about the company itself — the fields both create and edit send. */
function details(values: OrganizationValues) {
  return {
    name: values.name,
    legalName: values.legalName,
    industry: values.industry,
    companySize: values.companySize,
    description: values.description,
    contactEmail: values.contactEmail,
    phone: values.phone,
    website: values.website,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    city: values.city,
    region: values.region,
    postalCode: values.postalCode,
    country: values.country,
    currency: values.currency,
    locale: values.locale,
    timezone: values.timezone,
    fiscalYearStartMonth: Number(values.fiscalYearStartMonth),
    taxSystem: values.taxSystem,
    registrationNumber: values.registrationNumber,
    taxId: values.taxId,
    logoUrl: values.logoUrl,
  };
}

/** A new company: its details, and a handle unless it is to be made from the name. */
export function toCreateInput(values: OrganizationValues) {
  return { ...details(values), slug: values.slug || undefined };
}

/** An edit changes everything except the handle, which the company is filed under. */
export const toUpdateInput = details;
