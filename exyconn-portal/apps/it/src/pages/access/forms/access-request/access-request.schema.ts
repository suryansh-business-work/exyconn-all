import { z } from 'zod';
import { ItAccessKind } from '@exyconn/shell/graphql/generated';
import type { AccessRequestRow } from './access-request.types';

/** Kinds that grant something, so a level ("Editor", "Admin") is worth asking for. */
export const LEVELLED_KINDS: ReadonlySet<ItAccessKind> = new Set([
  ItAccessKind.Grant,
  ItAccessKind.RoleChange,
]);

export const accessRequestSchema = z
  .object({
    employeeId: z.string().min(1, 'Pick the employee'),
    application: z.string().trim().min(1, 'Pick the application'),
    kind: z.nativeEnum(ItAccessKind),
    accessLevel: z.string().trim().max(60, 'Too long'),
    reason: z.string().trim().min(5, 'Say why it is needed').max(500, 'Too long'),
    /** ISO string from the picker; empty means the grant does not expire. */
    expiresAt: z.string(),
  })
  .refine((v) => v.kind !== ItAccessKind.RoleChange || v.accessLevel.length > 0, {
    message: 'Say which role they should have',
    path: ['accessLevel'],
  })
  .refine((v) => !v.expiresAt || new Date(v.expiresAt).getTime() > Date.now(), {
    message: 'An expiry has to be in the future',
    path: ['expiresAt'],
  });

export type AccessRequestValues = z.infer<typeof accessRequestSchema>;

/** Drops fields that mean nothing for the chosen kind; an empty expiry is sent as null. */
export function toAccessRequestInput(values: AccessRequestValues) {
  const levelled = LEVELLED_KINDS.has(values.kind);
  return {
    ...values,
    accessLevel: levelled ? values.accessLevel : '',
    expiresAt: levelled && values.expiresAt ? values.expiresAt : null,
  };
}

export function toAccessRequestValues(
  row: AccessRequestRow | null,
  kind: ItAccessKind,
): AccessRequestValues {
  return {
    employeeId: row?.employeeId ?? '',
    application: row?.application ?? '',
    kind: row?.kind ?? kind,
    accessLevel: row?.accessLevel ?? '',
    reason: row?.reason ?? '',
    expiresAt: row?.expiresAt ?? '',
  };
}
