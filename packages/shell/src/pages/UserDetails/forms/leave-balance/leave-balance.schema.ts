import { z } from 'zod';
import type { LeaveBalanceFormValues, LeaveBalanceRow } from './leave-balance.types';

/** No leave year has more days than this, in either direction. */
const MAX_DAYS = 366;

const days = (label: string, min: number) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be whole days`)
    .min(min, min === 0 ? `${label} cannot be negative` : `${label} is too low`)
    .max(MAX_DAYS, `${label} is too high`);

/** What is left once the days taken come off everything granted. */
export const availableOf = (values: Omit<LeaveBalanceFormValues, 'leaveTypeCode'>): number =>
  values.allocated + values.carriedForward + values.adjustment - values.used;

export const leaveBalanceSchema = z
  .object({
    leaveTypeCode: z.string().trim().min(1, 'Choose a leave type'),
    allocated: days('Allocated', 0),
    carriedForward: days('Carried forward', 0),
    adjustment: days('Adjustment', -MAX_DAYS),
    used: days('Used', 0),
  })
  // A balance in the red is a number nobody can act on: take fewer days away instead.
  .refine((values) => availableOf(values) >= 0, {
    path: ['adjustment'],
    message: 'This would leave fewer than 0 days available',
  });

export type LeaveBalanceValues = z.infer<typeof leaveBalanceSchema>;

export const toFormValues = (row: LeaveBalanceRow | null): LeaveBalanceFormValues => ({
  leaveTypeCode: row?.leaveTypeCode ?? '',
  allocated: row?.allocated ?? 0,
  carriedForward: row?.carriedForward ?? 0,
  adjustment: row?.adjustment ?? 0,
  used: row?.used ?? 0,
});
