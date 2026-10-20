import { z } from 'zod';
import { HEX_COLOR, HTTP_URL } from '@exyconn/regex';
import type { MarketingFooterQuery } from '@exyconn/shell/graphql/generated';

export type MarketingFooterRow = MarketingFooterQuery['marketingFooter'];

const webAddress = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || HTTP_URL.test(value),
    'Enter a full web address, starting with https://',
  );

const color = z
  .string()
  .trim()
  .refine((value) => value === '' || HEX_COLOR.test(value), 'Use a colour like #2563eb');

export const marketingFooterSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Add the company name')
    .max(120, 'Keep it under 120 characters'),
  contactLine: z.string().trim().max(200, 'Keep it under 200 characters'),
  postalAddress: z
    .string()
    .trim()
    .min(1, 'Marketing law requires a postal address')
    .max(300, 'Keep it under 300 characters'),
  privacyUrl: webAddress,
  websiteUrl: webAddress,
  textColor: color,
  linkColor: color,
});

export type MarketingFooterValues = z.infer<typeof marketingFooterSchema>;
