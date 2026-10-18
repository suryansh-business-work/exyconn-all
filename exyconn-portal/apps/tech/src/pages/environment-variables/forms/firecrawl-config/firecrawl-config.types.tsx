import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import type { FirecrawlConfigsQuery } from '@exyconn/shell/graphql/generated';

export type FirecrawlConfigRow = FirecrawlConfigsQuery['firecrawlConfigs'][number];

/** Firecrawl's hosted API; a self-hosted Firecrawl has its own address instead. */
export const FIRECRAWL_DEFAULT_BASE_URL = 'https://api.firecrawl.dev';

const HOSTED_HOSTNAME = new URL(FIRECRAWL_DEFAULT_BASE_URL).hostname;

/** True for Firecrawl's hosted API, the one install that always needs an API key. */
export const isHostedFirecrawl = (baseUrl: string) =>
  URL.canParse(baseUrl.trim()) && new URL(baseUrl.trim()).hostname === HOSTED_HOSTNAME;

/**
 * The API key is write-only. Creating a config for the hosted API needs one; a self-hosted
 * Firecrawl without authentication needs none. Blank on an edit keeps the stored key.
 */
export const makeFirecrawlConfigSchema = (isEdit: boolean) =>
  z
    .object({
      label: z.string().trim().min(1, 'Label is required').max(100, 'At most 100 characters'),
      baseUrl: z
        .string()
        .trim()
        .min(1, 'Base URL is required')
        .max(300, 'At most 300 characters')
        .regex(HTTP_URL, 'Enter a URL starting with http:// or https://'),
      apiKey: z.string().trim(),
      isActive: z.enum(['true', 'false']),
    })
    .refine((values) => isEdit || values.apiKey !== '' || !isHostedFirecrawl(values.baseUrl), {
      path: ['apiKey'],
      message: 'An API key is required for the hosted Firecrawl API',
    });

export type FirecrawlConfigSchema = ReturnType<typeof makeFirecrawlConfigSchema>;
export type FirecrawlConfigValues = z.infer<FirecrawlConfigSchema>;
