import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListImageConfigsQuery,
  useDeleteImageConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { ImageConfigForm, type ImageConfigRow } from './forms/image-config';
import { TestUploadDialog } from './TestUploadDialog';

/** Tech sub-panel: manage image-upload (ImageKit) configurations (DB-backed). */
export function ImageConfigsPanel() {
  const { data, loading, refetch } = useListImageConfigsQuery();
  const [deleteConfig] = useDeleteImageConfigMutation();
  const dialog = useCrudDialog<ImageConfigRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const [testTarget, setTestTarget] = useState<ImageConfigRow | null>(null);

  const rows = data?.listImageConfigs ?? [];

  const actions: RowAction<ImageConfigRow>[] = [
    {
      icon: <CloudUploadIcon fontSize="small" />,
      tooltip: 'Test file upload',
      ariaLabel: 'test file upload',
      color: 'primary',
      onClick: setTestTarget,
    },
  ];

  const columns: Column<ImageConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'provider', label: 'Provider' },
    { key: 'urlEndpoint', label: 'Endpoint' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  const handleDelete = async (row: ImageConfigRow) => {
    const ok = await confirm({
      message: `Delete image config "${row.label}"?`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    await deleteConfig({ variables: { id: row.id } });
    await refetch();
    notify('Image config deleted');
  };

  return (
    <Box>
      <PageHeader
        title="Image upload configurations"
        subtitle="ImageKit providers used for uploads"
        actionLabel="New image config"
        onAction={dialog.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No image configs yet.'}
      />
      <CrudDialog
        open={dialog.open}
        title={dialog.editing ? 'Edit image config' : 'New image config'}
        onClose={dialog.close}
      >
        <ImageConfigForm
          initial={dialog.editing}
          onCancel={dialog.close}
          onDone={() => {
            void refetch();
            dialog.close();
          }}
        />
      </CrudDialog>
      {testTarget && (
        <TestUploadDialog
          open
          configId={testTarget.id}
          configLabel={testTarget.label}
          onClose={() => setTestTarget(null)}
        />
      )}
    </Box>
  );
}
