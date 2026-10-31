import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import { PlanInterval, Role } from '@exyconn/shell/graphql/generated';
import { currencyField } from '@exyconn/shell/utils/currencyField';
import type { PlanFormValues, PlanRow } from './plan.types';

const wholeNumber = (what: string, max: number) =>
  z.coerce
    .number({ message: `${what} must be a number` })
    .int(`${what} is a whole number`)
    .min(0, `${what} cannot be negative`)
    .max(max, `${what} is at most ${max}`);

export const planSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'A key is required')
      .max(40, 'Keep the key under 40 characters')
      .regex(SLUG, 'Lower-case letters, digits and dashes only'),
    name: z
      .string()
      .trim()
      .min(1, 'A name is required')
      .max(80, 'Keep the name under 80 characters'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    prices: z.array(
      z.object({
        currency: currencyField,
        amount: z.coerce
          .number({ message: 'The price must be a number' })
          .min(0, 'A price cannot be negative'),
      }),
    ),
    interval: z.enum(PlanInterval),
    trialDays: wholeNumber('Trial days', 365),
    seatLimit: wholeNumber('Seats', 1_000_000),
    allModules: z.boolean(),
    modules: z.array(z.enum(Role)),
    aiMonthlyUsdCap: z.coerce
      .number({ message: 'The AI cap must be a number' })
      .min(0, 'The AI cap cannot be negative'),
    isPublic: z.boolean(),
    isActive: z.boolean(),
    sortOrder: wholeNumber('Order', 10_000),
  })
  .refine((values) => new Set(values.prices.map((p) => p.currency)).size === values.prices.length, {
    message: 'Each currency can be priced once',
    path: ['prices'],
  })
  .refine((values) => values.allModules || values.modules.length > 0, {
    message: 'Pick the modules it includes, or include every module',
    path: ['modules'],
  });

/** The form's starting values: the plan being edited, or a blank monthly plan. */
export function toPlanValues(row: PlanRow | null): PlanFormValues {
  return {
    key: row?.key ?? '',
    name: row?.name ?? '',
    description: row?.description ?? '',
    prices: row?.prices.map((price) => ({ currency: price.currency, amount: price.amount })) ?? [],
    interval: row?.interval ?? PlanInterval.Month,
    trialDays: row?.trialDays ?? 14,
    seatLimit: row?.seatLimit ?? 0,
    allModules: row?.allModules ?? false,
    modules: row?.modules ?? [],
    aiMonthlyUsdCap: row?.aiMonthlyUsdCap ?? 0,
    isPublic: row?.isPublic ?? true,
    isActive: row?.isActive ?? true,
    sortOrder: row?.sortOrder ?? 0,
  };
}
