import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import {
  useListImageConfigsQuery,
  useDeleteImageConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { ImageConfigForm, type ImageConfigRow } from './forms/image-config';
import { TestUploadDialog } from './TestUploadDialog';

/** Environment Variables sub-panel: manage image-upload (ImageKit) configurations (DB-backed). */
export function ImageConfigsPanel() {
  const { data, loading, refetch } = useListImageConfigsQuery();
  const [deleteConfig] = useDeleteImageConfigMutation();
  const [testTarget, setTestTarget] = useState<ImageConfigRow | null>(null);
  const crud = useCrudResource<ImageConfigRow>({
    label: 'Image config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete image config "${row.label}"?`,
    refetch,
  });

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

  return (
    <Box>
      <PageHeader
        title="Image upload configurations"
        subtitle="ImageKit providers used for uploads"
        actionLabel="New image config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No image configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit image config' : 'New image config'}
        onClose={crud.close}
      >
        <ImageConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
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
