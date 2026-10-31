import { z } from 'zod';
import type { ListVendorInvoicesPagedQuery } from '@exyconn/shell/graphql/generated';

/** One vendor invoice as the review grid and its dialogs read it. */
export type VendorInvoiceRow =
  ListVendorInvoicesPagedQuery['listVendorInvoicesPaged']['rows'][number];

export const rejectVendorInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Say why the invoice is rejected')
    .max(1000, 'Keep the reason under 1000 characters'),
});

export type RejectVendorInvoiceValues = z.infer<typeof rejectVendorInvoiceSchema>;
