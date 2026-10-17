import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import type { FirecrawlConfigsQuery } from '@exyconn/shell/graphql/generated';
import { secretField } from '../../secret';

export type FirecrawlConfigRow = FirecrawlConfigsQuery['firecrawlConfigs'][number];

/** Firecrawl's hosted API; a self-hosted Firecrawl has its own address instead. */
export const FIRECRAWL_DEFAULT_BASE_URL = 'https://api.firecrawl.dev';

/** The API key is write-only: required to create, blank on an edit keeps the stored one. */
export const makeFirecrawlConfigSchema = (isEdit: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Label is required').max(100, 'At most 100 characters'),
    baseUrl: z
      .string()
      .trim()
      .min(1, 'Base URL is required')
      .max(300, 'At most 300 characters')
      .regex(HTTP_URL, 'Enter a URL starting with http:// or https://'),
    apiKey: secretField(isEdit, 'API key is required'),
    isActive: z.enum(['true', 'false']),
  });

export type FirecrawlConfigSchema = ReturnType<typeof makeFirecrawlConfigSchema>;
export type FirecrawlConfigValues = z.infer<FirecrawlConfigSchema>;
