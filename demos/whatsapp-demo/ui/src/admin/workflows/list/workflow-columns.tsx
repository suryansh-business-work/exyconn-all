import type { Column } from '@exyconn/shell/components/data/DataTable';
import { WorkflowStatusChip } from '../model/WorkflowStatusChip';
import type { WorkflowRow } from '../model/api';

/** The workflow list's columns; dates use the viewer's admin-configured format. */
export function workflowColumns(formatDateTime: (value: string) => string): Column<WorkflowRow>[] {
  return [
    { key: 'name', label: 'Name' },
    { key: 'key', label: 'Key' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <WorkflowStatusChip status={row.status} version={row.version} />,
    },
    { key: 'order', label: 'Menu position' },
    { key: 'keywords', label: 'Keywords', render: (row) => row.keywords.join(', ') || '—' },
    { key: 'updatedAt', label: 'Updated', render: (row) => formatDateTime(row.updatedAt) },
  ];
}
