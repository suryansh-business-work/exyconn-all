import type { InternalAuditFieldsFragment } from '@exyconn/shell/graphql/generated';

export type AuditRow = InternalAuditFieldsFragment;

export interface AuditFormValues {
  title: string;
  kind: string;
  standards: string[];
  scope: string;
  criteria: string;
  leadAuditorId: string;
  leadAuditorName: string;
  auditeeName: string;
  plannedOn: Date | null;
  performedOn: Date | null;
  status: string;
  summary: string;
  conclusion: string;
}
