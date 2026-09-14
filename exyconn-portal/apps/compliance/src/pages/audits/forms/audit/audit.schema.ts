import { z } from 'zod';
import { AuditKind, AuditStatus, ManagementStandard } from '@exyconn/shell/graphql/generated';
import type { AuditRow } from './audit.types';

/** Once an audit is reported it has been done, so it must say when and what it concluded. */
const REPORTED = new Set<string>([AuditStatus.Reported, AuditStatus.Closed]);

export const auditSchema = z
  .object({
    title: z.string().trim().min(1, 'Name the audit'),
    kind: z.nativeEnum(AuditKind),
    standards: z.array(z.nativeEnum(ManagementStandard)).min(1, 'Pick at least one standard'),
    scope: z.string().trim().min(1, 'Say what is being audited'),
    criteria: z.string().trim(),
    leadAuditorId: z.string().trim(),
    leadAuditorName: z.string().trim().min(1, 'Name the lead auditor'),
    auditeeName: z.string().trim(),
    plannedOn: z.date({ message: 'Say when it is planned for' }),
    performedOn: z.date().nullable(),
    status: z.nativeEnum(AuditStatus),
    summary: z.string().trim(),
    conclusion: z.string().trim(),
  })
  .refine((values) => !REPORTED.has(values.status) || values.performedOn !== null, {
    message: 'A reported audit has to say when it was carried out',
    path: ['performedOn'],
  })
  .refine((values) => !REPORTED.has(values.status) || values.conclusion.length > 0, {
    message: 'A reported audit has to say what it concluded',
    path: ['conclusion'],
  });

type Values = z.infer<typeof auditSchema>;

export function toAuditInput(values: Values) {
  return {
    ...values,
    plannedOn: values.plannedOn.toISOString(),
    performedOn: values.performedOn ? values.performedOn.toISOString() : null,
  };
}

export function toAuditValues(row: AuditRow | null): Values {
  return {
    title: row?.title ?? '',
    kind: row?.kind ?? AuditKind.Internal,
    standards: row?.standards ?? [],
    scope: row?.scope ?? '',
    criteria: row?.criteria ?? '',
    leadAuditorId: row?.leadAuditorId ?? '',
    leadAuditorName: row?.leadAuditorName ?? '',
    auditeeName: row?.auditeeName ?? '',
    plannedOn: row ? new Date(row.plannedOn) : new Date(),
    performedOn: row?.performedOn ? new Date(row.performedOn) : null,
    status: row?.status ?? AuditStatus.Planned,
    summary: row?.summary ?? '',
    conclusion: row?.conclusion ?? '',
  };
}
