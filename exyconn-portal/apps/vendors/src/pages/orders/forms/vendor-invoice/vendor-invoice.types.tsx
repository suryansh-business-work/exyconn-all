import { z } from 'zod';
import type { VendorInvoiceInput } from '@exyconn/shell/graphql/generated';

const MAX_NOTES = 2000;

/** The invoice a supplier sends against one order; the document is uploaded first. */
export const vendorInvoiceSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .min(1, 'Invoice number is required')
      .max(60, 'Keep the invoice number under 60 characters'),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    amount: z.coerce
      .number({ message: 'Must be a number' })
      .positive('The amount must be more than zero'),
    notes: z.string().trim().max(MAX_NOTES, 'Keep the notes under 2000 characters'),
    files: z
      .array(z.object({ url: z.string(), name: z.string(), contentType: z.string() }))
      .length(1, 'Attach the invoice document — one PDF or image'),
  })
  .refine((values) => values.dueDate === '' || values.dueDate >= values.invoiceDate, {
    message: 'The due date cannot be before the invoice date',
    path: ['dueDate'],
  });

export type VendorInvoiceFormInput = z.input<typeof vendorInvoiceSchema>;
export type VendorInvoiceFormValues = z.output<typeof vendorInvoiceSchema>;

/** The form's values as the API takes them, for one purchase order. */
export function toVendorInvoiceInput(
  purchaseOrderId: string,
  values: VendorInvoiceFormValues,
): VendorInvoiceInput {
  const [file] = values.files;
  return {
    purchaseOrderId,
    invoiceNumber: values.invoiceNumber,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    amount: values.amount,
    notes: values.notes,
    fileUrl: file.url,
    fileName: file.name,
  };
}
