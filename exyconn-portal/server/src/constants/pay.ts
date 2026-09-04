/**
 * How an employee is paid.
 *
 * Lives in `constants/` because three modules read it: HR writes it onto the salary
 * structure, payroll decides how to build a month's slip from it, and the tracker bills
 * time against the rate beside it.
 */
export const PAY_TYPES = ['FIXED', 'HOURLY', 'STIPEND', 'OTHER'] as const;
export type PayType = (typeof PAY_TYPES)[number];

/** What a salary structure looks like when nobody has set one up yet. */
export const DEFAULT_PAY_TYPE: PayType = 'FIXED';

/** Currency a salary structure is denominated in when none is chosen. */
export const DEFAULT_CURRENCY = 'INR';
