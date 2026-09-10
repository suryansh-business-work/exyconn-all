import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  useListToolsQuery,
  useDeleteToolMutation,
  ListToolsPagedDocument,
  type ListToolsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ToolForm, type ToolRow } from './forms/tool';
import { TOOL_COLUMNS, type PagedToolRow, type ToolsGridContext } from './tools-grid';
import { color } from '@exyconn/shell/components/ui';

/** Website CMS — the tools listed in the public tools directory (server-side grid). */
export function ToolsPage() {
  // Stat cards still summarise all tools; the grid itself is server-paged.
  const { data } = useListToolsQuery();
  const [deleteTool] = useDeleteToolMutation();
  const crud = useCrudResource<ToolRow, PagedToolRow>({
    label: 'Tool',
    onDelete: (row) => deleteTool({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete tool ${row.name}?`,
  });
  const fetchRows = usePagedFetcher(
    ListToolsPagedDocument,
    (result: ListToolsPagedQuery) => result.listToolsPaged,
  );

  const rows = data?.listTools ?? [];
  const categories = new Set(rows.map((r) => r.categorySlug));
  const stats: StatItem[] = [
    { label: 'Tools', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: color.green[300],
    },
    { label: 'MVP', value: String(rows.filter((r) => r.isMVP).length), accent: color.orange[500] },
    { label: 'Categories', value: String(categories.size), accent: color.violet[200] },
  ];

  const gridContext: ToolsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Tools"
      subtitle="The public tools directory"
      entityLabel="tool"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <ToolForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={TOOL_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search tools…"
    />
  );
}
