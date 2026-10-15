import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import {
  useCallingBotScenariosQuery,
  useDeleteCallingBotScenarioMutation,
} from '@exyconn/shell/graphql/generated';
import { CallingBotScenarioForm, type CallingBotScenarioRow } from './forms/calling-bot-scenario';

/** The example's own language, or that it speaks the settings' one. */
function LanguageCell({ row }: Readonly<{ row: CallingBotScenarioRow }>) {
  const t = useT();
  return <>{row.languageCode || t('Settings')}</>;
}

const COLUMNS: Column<CallingBotScenarioRow>[] = [
  { key: 'order', label: 'Order' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'languageCode', label: 'Language', render: (r) => <LanguageCell row={r} /> },
  {
    key: 'enabled',
    label: 'On the demo',
    render: (r) => <StatusChip value={r.enabled ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/** Where a new example goes: after the last one. */
const nextOrderOf = (rows: readonly CallingBotScenarioRow[]): number =>
  rows.reduce((last, row) => Math.max(last, row.order), 0) + 10;

/**
 * Tech > Demos > Calling bot > Examples: the calls a visitor can pick on the demo — a clinic
 * booking, a loan EMI reminder — each with the bot's role and opening line for that call.
 */
export function CallingBotScenariosPanel() {
  const { data, loading, refetch } = useCallingBotScenariosQuery();
  const [deleteScenario] = useDeleteCallingBotScenarioMutation();
  const rows = data?.callingBotScenarios ?? [];
  const crud = useCrudResource<CallingBotScenarioRow>({
    label: 'Calling bot example',
    scope: 'example',
    onDelete: (row) => deleteScenario({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the example "{title}"?',
      values: { title: row.title },
    }),
    refetch,
  });

  if (crud.open) {
    const title = crud.editing ? 'Edit example' : 'New example';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Examples">
        <CallingBotScenarioForm
          initial={crud.editing}
          nextOrder={nextOrderOf(rows)}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Examples"
        subtitle="The calls a visitor can pick on the calling bot demo, and who the bot is on each"
        actionLabel="New example"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No examples yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
