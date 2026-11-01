import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import type { VendorContactsQuery } from '@exyconn/shell/graphql/generated';

/** One person with vendor portal access, as the access panel lists them. */
export type VendorContactRow = VendorContactsQuery['vendorContacts'][number];

export const vendorContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Keep the name under 120 characters'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});

export type VendorContactFormValues = z.infer<typeof vendorContactSchema>;
