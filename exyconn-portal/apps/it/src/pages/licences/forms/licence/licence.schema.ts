import { z } from 'zod';
import { LicenceBillingCycle, LicenceStatus } from '@exyconn/shell/graphql/generated';
import type { LicenceRow } from './licence.types';

export const licenceSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    vendor: z.string().trim().min(1, 'Vendor is required'),
    seatsTotal: z.coerce
      .number({ message: 'Seats must be a number' })
      .int('Seats must be a whole number')
      .min(1, 'A licence needs at least one seat'),
    assigneeIds: z.array(z.string()),
    cost: z.coerce.number({ message: 'Cost must be a number' }).min(0, 'Cost cannot be negative'),
    billingCycle: z.nativeEnum(LicenceBillingCycle),
    renewalDate: z.date({ message: 'A renewal date is required' }),
    status: z.nativeEnum(LicenceStatus),
    notes: z.string().trim(),
  })
  // The server refuses this too; catching it here means the answer arrives while the
  // person is still looking at the seat list rather than after a round trip.
  .refine((v) => v.assigneeIds.length <= v.seatsTotal, {
    message: 'More people are assigned than this licence has seats',
    path: ['assigneeIds'],
  });

type Values = z.infer<typeof licenceSchema>;

/** Maps the validated form values onto the GraphQL input. */
export function toLicenceInput(values: Values) {
  return { ...values, renewalDate: values.renewalDate.toISOString() };
}

export function toLicenceValues(row: LicenceRow | null): Values {
  return {
    name: row?.name ?? '',
    vendor: row?.vendor ?? '',
    seatsTotal: row?.seatsTotal ?? 1,
    assigneeIds: row?.assigneeIds ?? [],
    cost: row?.cost ?? 0,
    billingCycle: row?.billingCycle ?? LicenceBillingCycle.Yearly,
    renewalDate: row ? new Date(row.renewalDate) : new Date(),
    status: row?.status ?? LicenceStatus.Active,
    notes: row?.notes ?? '',
  };
}
