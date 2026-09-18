import { z } from 'zod';
import type { PositionFormValues, PositionRow } from './position.types';

const money = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).min(0, 'Must be 0 or more');

export const positionSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80, 'Keep the name under 80 characters'),
    department: z.string().min(1, 'Department is required'),
    code: z.string().trim().max(12, 'Keep the code under 12 characters'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    minSalary: money('Minimum salary'),
    maxSalary: money('Maximum salary'),
    grade: z.string(),
    employmentType: z.string(),
    headcount: z.coerce
      .number({ message: 'Headcount must be a number' })
      .int('Headcount must be a whole number')
      .min(0, 'Must be 0 or more'),
    active: z.boolean(),
  })
  .refine((v) => v.minSalary <= v.maxSalary, {
    path: ['maxSalary'],
    message: 'Maximum salary cannot be less than the minimum',
  });

export type PositionSchemaInput = z.input<typeof positionSchema>;

/** Form defaults: the row being edited, or a new position in `department`. */
export const toFormValues = (row: PositionRow | null, department: string): PositionFormValues => ({
  name: row?.name ?? '',
  department: row?.department ?? department,
  code: row?.code ?? '',
  description: row?.description ?? '',
  minSalary: row?.minSalary ?? 0,
  maxSalary: row?.maxSalary ?? 0,
  grade: row?.grade ?? '',
  employmentType: row?.employmentType ?? '',
  headcount: row?.headcount ?? 1,
  active: row?.active ?? true,
});

/** Empty optional pickers go to the server as null, not as an empty code. */
export const toPositionInput = (values: PositionFormValues) => ({
  ...values,
  code: values.code || null,
  description: values.description || null,
  grade: values.grade || null,
  employmentType: values.employmentType || null,
});
