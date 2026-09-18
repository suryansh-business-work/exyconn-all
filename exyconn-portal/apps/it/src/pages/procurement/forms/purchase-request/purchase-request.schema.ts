import { z } from 'zod';
import { ItPurchaseKind, ItPurchaseStatus } from '@exyconn/shell/graphql/generated';
import type { PurchaseRequestRow } from './purchase-request.types';

/** Only the approve action may set these, so the form never offers them. */
const DECIDED: ReadonlySet<ItPurchaseStatus> = new Set([
  ItPurchaseStatus.Approved,
  ItPurchaseStatus.Rejected,
]);

export function purchaseStatusOptions(current: ItPurchaseStatus | null): ItPurchaseStatus[] {
  return Object.values(ItPurchaseStatus).filter(
    (status) => !DECIDED.has(status) || status === current,
  );
}

const quoteSchema = z.object({
  vendor: z.string().trim().min(1, 'Vendor is required').max(120, 'Too long'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Cannot be negative'),
  notes: z.string().trim().max(300, 'Too long'),
});

export const purchaseRequestSchema = z
  .object({
    title: z.string().trim().min(3, 'Say what is being bought').max(160, 'Too long'),
    kind: z.nativeEnum(ItPurchaseKind),
    quantity: z.coerce
      .number({ message: 'Quantity must be a number' })
      .int('Whole numbers only')
      .min(1, 'At least one'),
    estimatedCost: z.coerce
      .number({ message: 'Cost must be a number' })
      .min(0, 'Cost cannot be negative'),
    requestedForName: z.string().trim().max(120, 'Too long'),
    justification: z.string().trim().min(10, 'Say why it is needed').max(2000, 'Too long'),
    quotes: z.array(quoteSchema),
    status: z.nativeEnum(ItPurchaseStatus),
    orderReference: z.string().trim().max(120, 'Too long'),
  })
  // "Quoted" with no quote on it is a status nobody can check.
  .refine((v) => v.status !== ItPurchaseStatus.Quoted || v.quotes.length > 0, {
    message: 'Add at least one quote before marking it quoted',
    path: ['status'],
  })
  .refine((v) => v.status !== ItPurchaseStatus.Ordered || v.orderReference.length > 0, {
    message: "Add the supplier's order reference",
    path: ['orderReference'],
  });

export type PurchaseRequestValues = z.infer<typeof purchaseRequestSchema>;

export function toPurchaseRequestValues(row: PurchaseRequestRow | null): PurchaseRequestValues {
  return {
    title: row?.title ?? '',
    kind: row?.kind ?? ItPurchaseKind.Hardware,
    quantity: row?.quantity ?? 1,
    estimatedCost: row?.estimatedCost ?? 0,
    requestedForName: row?.requestedForName ?? '',
    justification: row?.justification ?? '',
    quotes: (row?.quotes ?? []).map(({ vendor, amount, notes }) => ({ vendor, amount, notes })),
    status: row?.status ?? ItPurchaseStatus.Requested,
    orderReference: row?.orderReference ?? '',
  };
}
