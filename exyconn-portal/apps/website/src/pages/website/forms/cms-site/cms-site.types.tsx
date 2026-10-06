import { z } from 'zod';
import { DOMAIN, SLUG } from '@exyconn/regex';
import {
  CmsSiteStatus,
  type CmsSiteFieldsFragment,
  type CmsSiteInput,
} from '@exyconn/shell/graphql/generated';

/** A website as Website › Websites lists and edits it. */
export type CmsSiteRow = CmsSiteFieldsFragment;

const CODE_LIMIT = 100_000;

export const cmsSiteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'The key needs at least 2 characters')
    .max(50, 'Keep the key under 50 characters')
    .regex(SLUG, 'Use lower-case letters, digits and dashes'),
  domains: z
    .array(z.string().trim().toLowerCase().regex(DOMAIN, 'Enter a bare domain, like example.com'))
    .max(20, 'At most 20 domains'),
  status: z.enum(CmsSiteStatus),
  markets: z.boolean(),
  defaultLocale: z.string().trim().min(2, 'Enter a locale, like en').max(20, 'Too long'),
  faviconUrl: z.string().trim().max(500, 'Too long'),
  seo: z.object({
    titleTemplate: z.string().trim().max(120, 'Keep it under 120 characters'),
    description: z.string().trim().max(500, 'Keep it under 500 characters'),
    ogImageUrl: z.string().trim().max(500, 'Too long'),
  }),
  headerFragmentId: z.string(),
  footerFragmentId: z.string(),
  designSystemId: z.string(),
  notFoundPageId: z.string(),
  headHtml: z.string().max(CODE_LIMIT, 'Too long'),
  bodyEndHtml: z.string().max(CODE_LIMIT, 'Too long'),
  globalCss: z.string().max(CODE_LIMIT, 'Too long'),
});

export type CmsSiteFormValues = z.infer<typeof cmsSiteSchema>;

export const toSiteFormValues = (row: CmsSiteRow | null): CmsSiteFormValues => ({
  name: row?.name ?? '',
  slug: row?.slug ?? '',
  domains: [...(row?.domains ?? [])],
  status: row?.status ?? CmsSiteStatus.Draft,
  markets: row?.markets ?? false,
  defaultLocale: row?.defaultLocale ?? 'en',
  faviconUrl: row?.faviconUrl ?? '',
  seo: {
    titleTemplate: row?.seo.titleTemplate ?? '%s',
    description: row?.seo.description ?? '',
    ogImageUrl: row?.seo.ogImageUrl ?? '',
  },
  headerFragmentId: row?.headerFragmentId ?? '',
  footerFragmentId: row?.footerFragmentId ?? '',
  designSystemId: row?.designSystemId ?? '',
  notFoundPageId: row?.notFoundPageId ?? '',
  headHtml: row?.headHtml ?? '',
  bodyEndHtml: row?.bodyEndHtml ?? '',
  globalCss: row?.globalCss ?? '',
});

/** The form's values are the server's input as they stand. */
export const toSiteInput = (values: CmsSiteFormValues): CmsSiteInput => values;
