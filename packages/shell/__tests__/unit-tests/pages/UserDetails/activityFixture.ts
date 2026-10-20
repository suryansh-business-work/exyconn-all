import type { AuditLogRow } from '@/components/audit';
import { AuditAction } from '@/graphql/generated';

/** One thing a person did, filed under the Meeting Assistant; override what a test needs. */
export function makeActivity(patch: Partial<AuditLogRow> = {}): AuditLogRow {
  return {
    id: 'log-1',
    actorId: 'emp-1',
    actorName: 'Meera Nair',
    actorEmail: 'meera@example.com',
    action: AuditAction.Update,
    module: 'Meeting Assistant',
    entityId: 'meeting-1',
    entityLabel: 'Weekly sync',
    summary: 'Edited the notes of Weekly sync',
    changes: '',
    ip: '',
    createdAt: '2026-10-20T09:30:00.000Z',
    ...patch,
  };
}
