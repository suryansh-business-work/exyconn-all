import type { ReactNode } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import { ChannelStatus } from './ChannelStatus';
import { useConfigTest } from './useConfigTest';

/** The handlers a channel's create/edit form takes. */
export interface ConfigFormHandlers<Row> {
  initial: Row | null;
  onDone: () => void;
  onCancel: () => void;
}

interface ChannelConfigsPanelProps<Row extends { id: string; label: string }> {
  /** The tab's heading, e.g. "Call". */
  title: string;
  subtitle: string;
  /** One account, in words, e.g. "call account". */
  noun: string;
  status: { ready: boolean; provider?: string | null } | undefined;
  /** What connecting the channel enables, shown while it is not connected. */
  hint: string;
  emptyMessage: string;
  deleteMessage: string;
  columns: Column<Row>[];
  rows: Row[];
  loading: boolean;
  refetch: () => Promise<unknown>;
  onDelete: (row: Row) => Promise<unknown>;
  /** Checks the stored credentials with the provider; resolves to what it said. */
  onTest: (id: string) => Promise<string | undefined>;
  renderForm: (handlers: ConfigFormHandlers<Row>) => ReactNode;
}

/**
 * One channel's tab on CRM > Integrations: whether it is connected, its provider accounts with
 * Test, Edit and Delete, and the create/edit form in place of the list.
 */
export function ChannelConfigsPanel<Row extends { id: string; label: string }>(
  props: Readonly<ChannelConfigsPanelProps<Row>>,
) {
  const t = useT();
  const { title, noun, status, columns, rows, loading, refetch, renderForm } = props;
  const nounValues = { noun: t(noun) };
  const crud = useCrudResource<Row>({
    label: noun,
    onDelete: props.onDelete,
    confirmMessage: (row) => ({ message: props.deleteMessage, values: { label: row.label } }),
    refetch,
  });
  const test = useConfigTest(props.onTest);
  const actions: RowAction<Row>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test the credentials',
      ariaLabel: 'test the credentials',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit {noun}' : 'New {noun}'}
        titleValues={nounValues}
        onBack={crud.close}
        backLabel="Back to {list}"
        backLabelValues={{ list: t(title) }}
      >
        {renderForm({ initial: crud.editing, onDone: crud.onDone, onCancel: crud.close })}
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={props.subtitle}
        actionLabel="New {noun}"
        actionLabelValues={nounValues}
        onAction={crud.openCreate}
      />
      <ChannelStatus ready={status?.ready ?? false} provider={status?.provider} hint={props.hint} />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={props.emptyMessage}
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
