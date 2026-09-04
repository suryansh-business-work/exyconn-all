import { z } from 'zod';
import { PayType, type EmployeeSalaryQuery, type EmployeeSalaryInput } from '@/graphql/generated';

/** The salary structure as it comes back for one employee, or null before HR sets one up. */
export type EmployeeSalary = NonNullable<EmployeeSalaryQuery['employeeSalary']>;

/** Currency a new structure starts in. HR can change it per employee. */
export const DEFAULT_CURRENCY = 'INR';

/** Pay types whose money is a single figure rather than the monthly components. */
const SINGLE_AMOUNT = new Set<PayType>([PayType.Hourly, PayType.Stipend, PayType.Other]);

/** Whether this pay type is paid as one amount (`rate`) rather than basic/HRA/allowances. */
export function usesSingleAmount(payType: PayType): boolean {
  return SINGLE_AMOUNT.has(payType);
}

/** What `rate` means for the pay type, said in the words the form should use. */
export function rateLabel(payType: PayType): string {
  return payType === PayType.Hourly ? 'Rate per hour' : 'Amount per month';
}

/** A money field: typed as a string because a number input's empty state is '', not 0. */
const money = (label: string) =>
  z
    .string()
    .refine(
      (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0),
      `${label} must be 0 or more`,
    );

export const compensationSchema = z
  .object({
    payType: z.nativeEnum(PayType),
    payTypeNote: z.string().trim(),
    currency: z.string().trim().min(1, 'Currency is required'),
    basic: money('Basic'),
    hra: money('HRA'),
    allowances: money('Allowances'),
    deductions: money('Deductions'),
    rate: money('Rate'),
    billingRate: money('Billing rate'),
    effectiveFrom: z.string().min(1, 'Effective from is required'),
  })
  // The amount that actually pays this person has to be there. Which field that is depends
  // on the pay type, so neither can be required outright.
  .refine((v) => !usesSingleAmount(v.payType) || Number(v.rate) > 0, {
    path: ['rate'],
    message: 'Enter the amount this employee is paid',
  })
  .refine((v) => v.payType !== PayType.Fixed || Number(v.basic) > 0, {
    path: ['basic'],
    message: 'Enter the basic salary',
  })
  .refine((v) => v.payType !== PayType.Other || v.payTypeNote !== '', {
    path: ['payTypeNote'],
    message: 'Describe the pay arrangement',
  });

export type CompensationValues = z.infer<typeof compensationSchema>;

const amount = (value: number | null | undefined): string => String(value ?? 0);

/** Form defaults for an employee with no structure yet, or their stored one. */
export function toCompensationValues(
  salary: EmployeeSalary | null,
  joinDate?: string | null,
): CompensationValues {
  return {
    payType: salary?.payType ?? PayType.Fixed,
    payTypeNote: salary?.payTypeNote ?? '',
    currency: salary?.currency ?? DEFAULT_CURRENCY,
    basic: amount(salary?.basic),
    hra: amount(salary?.hra),
    allowances: amount(salary?.allowances),
    deductions: amount(salary?.deductions),
    rate: amount(salary?.rate),
    billingRate: amount(salary?.billingRate),
    // A new structure takes effect the day they join, which is the answer often enough that
    // asking again would just be a second chance to type it differently.
    effectiveFrom: salary?.effectiveFrom ?? joinDate ?? '',
  };
}

/**
 * The GraphQL input.
 *
 * The fields the chosen pay type does not use are sent as zero rather than left alone: a
 * stipend that still carries last month's basic salary is a number payroll would happily
 * pay out.
 */
export function toSalaryInput(v: CompensationValues): EmployeeSalaryInput {
  const single = usesSingleAmount(v.payType);
  return {
    currency: v.currency,
    payType: v.payType,
    payTypeNote: v.payType === PayType.Other ? v.payTypeNote : '',
    basic: single ? 0 : Number(v.basic),
    hra: single ? 0 : Number(v.hra),
    allowances: single ? 0 : Number(v.allowances),
    deductions: Number(v.deductions),
    rate: single ? Number(v.rate) : 0,
    billingRate: Number(v.billingRate),
    effectiveFrom: v.effectiveFrom,
  };
}
