import { z } from 'zod';
import { PAGE_PATH } from '@exyconn/regex';
import {
  CmsPageKind,
  CmsPageLayout,
  type CmsPageFieldsFragment,
  type CmsPageSettingsInput,
} from '@exyconn/shell/graphql/generated';

/** A page with its settings, as the editor loads it. */
export type CmsPageDetail = CmsPageFieldsFragment;

const isJsonObjectOrEmpty = (value: string): boolean => {
  if (value.trim() === '') return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
};

export const pageSettingsSchema = z
  .object({
    path: z
      .string()
      .trim()
      .min(1, 'Path is required')
      .max(200, 'Keep the path under 200 characters')
      .regex(PAGE_PATH, 'Use a path like /about-us: lower-case letters, digits and dashes'),
    title: z.string().trim().min(1, 'Title is required').max(200, 'Too long'),
    kind: z.enum(CmsPageKind),
    layout: z.enum(CmsPageLayout),
    seo: z.object({
      title: z.string().trim().max(200, 'Too long'),
      description: z.string().trim().max(500, 'Keep it under 500 characters'),
      keywords: z.string().trim().max(500, 'Too long'),
      ogImageUrl: z.string().trim().max(500, 'Too long'),
      canonical: z.string().trim().max(500, 'Too long'),
      noindex: z.boolean(),
      jsonLd: z
        .string()
        .refine(isJsonObjectOrEmpty, 'Enter a JSON object or array, or leave it empty'),
    }),
  })
  .refine((values) => values.kind === CmsPageKind.Page || values.path.includes('/:'), {
    path: ['path'],
    message: 'A template needs a parameter in its path, like /blog/:slug',
  })
  .refine((values) => values.kind === CmsPageKind.Template || !values.path.includes('/:'), {
    path: ['path'],
    message: 'Only a template may have a parameter in its path',
  });

export type PageSettingsFormValues = z.infer<typeof pageSettingsSchema>;

export const toPageSettingsValues = (page: CmsPageDetail | null): PageSettingsFormValues => ({
  path: page?.path ?? '/',
  title: page?.title ?? '',
  kind: page?.kind ?? CmsPageKind.Page,
  layout: page?.layout ?? CmsPageLayout.Default,
  seo: {
    title: page?.seo.title ?? '',
    description: page?.seo.description ?? '',
    keywords: page?.seo.keywords ?? '',
    ogImageUrl: page?.seo.ogImageUrl ?? '',
    canonical: page?.seo.canonical ?? '',
    noindex: page?.seo.noindex ?? false,
    jsonLd: page?.seo.jsonLd ? JSON.stringify(page.seo.jsonLd, null, 2) : '',
  },
});

export const toPageSettingsInput = (values: PageSettingsFormValues): CmsPageSettingsInput => ({
  ...values,
  seo: {
    ...values.seo,
    jsonLd: values.seo.jsonLd.trim() ? (JSON.parse(values.seo.jsonLd) as unknown) : null,
  },
});
