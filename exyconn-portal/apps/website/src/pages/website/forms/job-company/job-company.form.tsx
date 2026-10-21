import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { HEX_COLOR, HTTP_URL, LINK, SLUG } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Divider, Typography } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSwitch, RhfRichText } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCurrentSiteId } from '../../../cms/site';
import {
  useCreateJobCompanyMutation,
  useUpdateJobCompanyMutation,
} from '@exyconn/shell/graphql/generated';
import { MEDIA_FOLDERS } from '../../live-edit/live-edit.config';
import { CompanyBenefitsFields } from './company-benefits.fields';
import {
  CompanyIdentityFields,
  CompanyProfileFields,
  CompanySocialFields,
} from './company-profile.fields';
import type { JobCompanyRow } from './job-company.types';
import { ItemSeoFields, itemSeoSchema, toItemSeoValues } from '../item-seo';

const benefitSchema = z.object({
  icon: z.string().trim().min(1, 'Icon is required'),
  title: z.string().trim().min(1, 'Benefit title is required'),
  description: z.string().trim(),
});

const schema = z.object({
  companyCode: z.string().trim().min(1, 'Company code is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(SLUG, 'Lower-case letters, numbers and hyphens only'),
  name: z.string().trim().min(1, 'Name is required'),
  logo: z
    .string()
    .trim()
    .regex(LINK, 'Enter a full URL or a path starting with /')
    .or(z.literal('')),
  tagline: z.string().trim(),
  description: z.string().trim(),
  culture: z.string().trim(),
  website: z
    .string()
    .trim()
    .regex(HTTP_URL, 'Enter a full URL starting with https://')
    .or(z.literal('')),
  founded: z.string().trim(),
  employees: z.string().trim(),
  industry: z.string().trim(),
  headquarters: z.string().trim(),
  benefits: z.array(benefitSchema),
  socialLinks: z.object({
    linkedin: z
      .string()
      .trim()
      .regex(HTTP_URL, 'Enter a full URL starting with https://')
      .or(z.literal('')),
    twitter: z
      .string()
      .trim()
      .regex(HTTP_URL, 'Enter a full URL starting with https://')
      .or(z.literal('')),
    facebook: z
      .string()
      .trim()
      .regex(HTTP_URL, 'Enter a full URL starting with https://')
      .or(z.literal('')),
    instagram: z
      .string()
      .trim()
      .regex(HTTP_URL, 'Enter a full URL starting with https://')
      .or(z.literal('')),
  }),
  brandColor: z
    .string()
    .trim()
    .regex(HEX_COLOR, 'Use a 6-digit hex colour, e.g. #f9851f')
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR, 'Use a 6-digit hex colour, e.g. #f9851f')
    .or(z.literal('')),
  isActive: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Order must be ≥ 0'),
  seo: itemSeoSchema,
});
type Values = z.infer<typeof schema>;

const toInitial = (row: JobCompanyRow | null): Values => ({
  companyCode: row?.companyCode ?? '',
  slug: row?.slug ?? '',
  name: row?.name ?? '',
  logo: row?.logo ?? '',
  tagline: row?.tagline ?? '',
  description: row?.description ?? '',
  culture: row?.culture ?? '',
  website: row?.website ?? '',
  founded: row?.founded ?? '',
  employees: row?.employees ?? '',
  industry: row?.industry ?? '',
  headquarters: row?.headquarters ?? '',
  benefits: (row?.benefits ?? []).map((benefit) => ({
    icon: benefit.icon,
    title: benefit.title,
    description: benefit.description,
  })),
  socialLinks: {
    linkedin: row?.socialLinks.linkedin ?? '',
    twitter: row?.socialLinks.twitter ?? '',
    facebook: row?.socialLinks.facebook ?? '',
    instagram: row?.socialLinks.instagram ?? '',
  },
  brandColor: row?.brandColor ?? '',
  secondaryColor: row?.secondaryColor ?? '',
  isActive: row?.isActive ?? true,
  order: row?.order ?? 0,
  seo: toItemSeoValues(row?.seo),
});

interface JobCompanyFormProps {
  initial: JobCompanyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a job company. */
export function JobCompanyForm({ initial, onDone, onCancel }: Readonly<JobCompanyFormProps>) {
  const siteId = useCurrentSiteId();
  const t = useT();
  const [createJobCompany] = useCreateJobCompanyMutation();
  const [updateJobCompany] = useUpdateJobCompanyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Company',
    initial,
    create: (values: Values) => createJobCompany({ variables: { input: { ...values, siteId } } }),
    update: (row, values) => updateJobCompany({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <CompanyIdentityFields siteId={siteId} />
      <RhfRichText
        name="description"
        label="Description"
        folder={MEDIA_FOLDERS.careers}
        helperText="Shown on the company's careers page"
      />
      <RhfRichText
        name="culture"
        label="Culture"
        folder={MEDIA_FOLDERS.careers}
        helperText="Shown on the company's careers page"
      />

      <Divider />
      <CompanyProfileFields />

      <Divider />
      <CompanyBenefitsFields />

      <Divider />
      <CompanySocialFields />

      <Divider />
      <Typography variant="subtitle2">{t('Branding & visibility')}</Typography>
      <RhfTextField name="brandColor" label="Brand color" helperText="Hex value, e.g. #f9851f" />
      <RhfTextField
        name="secondaryColor"
        label="Secondary color"
        helperText="Optional. Hex value for accents, e.g. #1f2a44."
      />
      <RhfTextField
        name="order"
        label="Order"
        type="number"
        helperText="Lower numbers appear first in the company list."
      />
      <RhfSwitch name="isActive" label="Active" />
      <ItemSeoFields siteId={siteId} />
    </EntityForm>
  );
}
