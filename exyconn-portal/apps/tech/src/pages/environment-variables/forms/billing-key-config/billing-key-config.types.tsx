import { z } from 'zod';
import { BillingProvider, type BillingKeyConfigsQuery } from '@exyconn/shell/graphql/generated';

export type BillingKeyConfigRow = BillingKeyConfigsQuery['billingKeyConfigs'][number];

/**
 * A billing key reads a provider's real bill. It is write-only and sealed on the server: a new
 * config needs one, and blank on an edit keeps the stored key.
 */
export const makeBillingKeyConfigSchema = (isEdit: boolean) =>
  z
    .object({
      provider: z.enum(BillingProvider, { message: 'Choose the provider' }),
      label: z.string().trim().min(1, 'Label is required').max(100, 'At most 100 characters'),
      key: z.string().trim().max(500, 'At most 500 characters'),
      isActive: z.enum(['true', 'false']),
    })
    .refine((values) => isEdit || values.key !== '', {
      path: ['key'],
      message: 'The billing key is required',
    });

export type BillingKeyConfigSchema = ReturnType<typeof makeBillingKeyConfigSchema>;
export type BillingKeyConfigValues = z.infer<BillingKeyConfigSchema>;
