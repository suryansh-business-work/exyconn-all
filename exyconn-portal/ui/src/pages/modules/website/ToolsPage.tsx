import { DataTable, type Column } from '../../../components/data/DataTable';
import { BoolChip } from '../../../components/data/BoolChip';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListToolsQuery, useDeleteToolMutation } from '../../../graphql/generated';
import { ToolForm, type ToolRow } from './forms/tool';

/** Website CMS — the tools listed in the public tools directory. */
export function ToolsPage() {
  const { data, loading, refetch } = useListToolsQuery();
  const [deleteTool] = useDeleteToolMutation();
  const dialog = useCrudDialog<ToolRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listTools ?? [];
  const categories = new Set(rows.map((r) => r.categorySlug));
  const stats: StatItem[] = [
    { label: 'Tools', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: '#7be37b',
    },
    { label: 'MVP', value: String(rows.filter((r) => r.isMVP).length), accent: '#f9851f' },
    { label: 'Categories', value: String(categories.size), accent: '#b18cff' },
  ];

  const columns: Column<ToolRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'toolCode', label: 'Code' },
    { key: 'categorySlug', label: 'Category' },
    { key: 'url', label: 'URL' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'isMVP',
      label: 'MVP',
      render: (r) => <BoolChip value={r.isMVP} />,
    },
    { key: 'order', label: 'Order' },
  ];

  const handleDelete = async (row: ToolRow) => {
    const ok = await confirm({ message: `Delete tool ${row.name}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteTool({ variables: { id: row.id } });
    await refetch();
    notify('Tool deleted');
  };

  return (
    <ModuleDashboard
      title="Tools"
      subtitle="The public tools directory"
      actionLabel="New tool"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit tool' : 'New tool'}
          onClose={dialog.close}
        >
          <ToolForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No tools yet.'}
      />
    </ModuleDashboard>
  );
}
