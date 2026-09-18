import { z } from 'zod';
import {
  ItChangeStatus,
  ItChangeType,
  ItEnvironment,
  ItRisk,
} from '@exyconn/shell/graphql/generated';
import type { ChangeRow } from './change.types';

/** Only the approve action may set these, so the form never offers them. */
const DECIDED: ReadonlySet<ItChangeStatus> = new Set([
  ItChangeStatus.Approved,
  ItChangeStatus.Rejected,
]);

/** The statuses the form may set: everything but a decision (a decided one is kept as is). */
export function changeStatusOptions(current: ItChangeStatus | null): ItChangeStatus[] {
  return Object.values(ItChangeStatus).filter(
    (status) => !DECIDED.has(status) || status === current,
  );
}

export const changeSchema = z
  .object({
    title: z.string().trim().min(4, 'Give the change a title').max(160, 'Too long'),
    description: z.string().trim().min(10, 'Describe what will change').max(4000, 'Too long'),
    type: z.nativeEnum(ItChangeType),
    risk: z.nativeEnum(ItRisk),
    environment: z.nativeEnum(ItEnvironment),
    system: z.string().trim().min(2, 'Name the system being changed').max(120, 'Too long'),
    status: z.nativeEnum(ItChangeStatus),
    /** ISO strings from the pickers. */
    plannedStart: z.string().min(1, 'When does it start?'),
    plannedEnd: z.string().min(1, 'When does it end?'),
    ownerName: z.string().trim().max(120, 'Too long'),
    rollbackPlan: z.string().trim().max(4000, 'Too long'),
  })
  .refine((v) => new Date(v.plannedEnd) > new Date(v.plannedStart), {
    message: 'The window must end after it starts',
    path: ['plannedEnd'],
  })
  // A production change that can go wrong needs a way back before it is attempted.
  .refine(
    (v) =>
      v.environment !== ItEnvironment.Production ||
      v.risk === ItRisk.Low ||
      v.rollbackPlan.length > 0,
    {
      message: 'A medium or high risk production change needs a rollback plan',
      path: ['rollbackPlan'],
    },
  );

export type ChangeValues = z.infer<typeof changeSchema>;

export function toChangeValues(row: ChangeRow | null): ChangeValues {
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    type: row?.type ?? ItChangeType.Normal,
    risk: row?.risk ?? ItRisk.Medium,
    environment: row?.environment ?? ItEnvironment.Production,
    system: row?.system ?? '',
    status: row?.status ?? ItChangeStatus.Draft,
    plannedStart: row?.plannedStart ?? new Date().toISOString(),
    plannedEnd: row?.plannedEnd ?? new Date(Date.now() + 3_600_000).toISOString(),
    ownerName: row?.ownerName ?? '',
    rollbackPlan: row?.rollbackPlan ?? '',
  };
}
