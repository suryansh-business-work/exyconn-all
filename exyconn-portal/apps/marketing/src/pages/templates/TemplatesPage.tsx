import { useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Flex, Heading, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDeleteCampaignTemplateMutation,
  useDuplicateCampaignTemplateMutation,
  useListCampaignTemplatesQuery,
} from '@exyconn/shell/graphql/generated';
import { TemplatePreview } from './TemplatePreview';
import { TemplateVersions } from './TemplateVersions';
import type { CampaignTemplateRow } from '../marketing/forms/campaign-template';

type Open = { kind: 'preview' | 'versions'; row: CampaignTemplateRow } | null;

/** The row's actions as labelled icon buttons. */
function RowActions({
  row,
  onOpen,
  onDuplicate,
  onDelete,
}: Readonly<{
  row: CampaignTemplateRow;
  onOpen: (open: Open) => void;
  onDuplicate: (row: CampaignTemplateRow) => void;
  onDelete: (row: CampaignTemplateRow) => void;
}>) {
  const t = useT();
  const actions = [
    {
      key: 'preview',
      label: t('Preview {name}', { name: row.name }),
      icon: <VisibilityIcon fontSize="small" />,
      run: () => onOpen({ kind: 'preview', row }),
    },
    {
      key: 'versions',
      label: t('Version history of {name}', { name: row.name }),
      icon: <HistoryIcon fontSize="small" />,
      run: () => onOpen({ kind: 'versions', row }),
    },
    {
      key: 'duplicate',
      label: t('Duplicate {name}', { name: row.name }),
      icon: <ContentCopyIcon fontSize="small" />,
      run: () => onDuplicate(row),
    },
    {
      key: 'delete',
      label: t('Delete {name}', { name: row.name }),
      icon: <DeleteOutlinedIcon fontSize="small" />,
      run: () => onDelete(row),
    },
  ];
  return (
    <Flex direction="row">
      {actions.map((action) => (
        <Tooltip key={action.key} title={action.label}>
          <IconButton size="small" aria-label={action.label} onClick={action.run}>
            {action.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Flex>
  );
}

/**
 * Marketing → Templates: reusable email designs. They are made with "Save as template" in the
 * Email Studio; a campaign started from one gets its own copy.
 */
export function TemplatesPage() {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useFormatters();
  const { data, loading, refetch } = useListCampaignTemplatesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [duplicate] = useDuplicateCampaignTemplateMutation();
  const [remove] = useDeleteCampaignTemplateMutation();
  const [open, setOpen] = useState<Open>(null);

  const run = async (work: () => Promise<unknown>, done: string, failed: string) => {
    try {
      await work();
      notify(done, 'success');
      await refetch();
    } catch (err) {
      notify(errorMessage(err, failed), 'error');
    }
  };
  const onDuplicate = (row: CampaignTemplateRow) =>
    run(
      () => duplicate({ variables: { id: row.id } }),
      'Template duplicated',
      'The template could not be duplicated',
    );
  const onDelete = async (row: CampaignTemplateRow) => {
    const ok = await confirm({
      title: 'Delete template?',
      message: 'Delete “{name}” and its history? Campaigns made from it keep their own copy.',
      messageValues: { name: row.name },
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok)
      await run(
        () => remove({ variables: { id: row.id } }),
        'Template deleted',
        'The template could not be deleted',
      );
  };

  const columns: Column<CampaignTemplateRow>[] = [
    { key: 'name', label: 'Template' },
    { key: 'category', label: 'Category' },
    { key: 'version', label: 'Version' },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => `${formatDateTime(row.updatedAt)} · ${row.updatedByName || '—'}`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <RowActions row={row} onOpen={setOpen} onDuplicate={onDuplicate} onDelete={onDelete} />
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Flex direction="column" spacing={2}>
        <Heading level={1} sx={{ fontSize: 'h4.fontSize' }}>
          {t('Email templates')}
        </Heading>
        <Text size="sm" color="text.secondary">
          {t(
            'Save a design as a template from the Email Studio. Editing a template never changes campaigns already made from it.',
          )}
        </Text>
        <DataTable
          columns={columns}
          rows={data?.listCampaignTemplates ?? []}
          loading={loading}
          onRefresh={refetch}
          emptyMessage="No templates yet. Use “Save as template” in the Email Studio."
        />
      </Flex>
      <CrudDialog
        open={Boolean(open)}
        title={open?.kind === 'versions' ? t('Version history') : t('Template preview')}
        onClose={() => setOpen(null)}
      >
        {open?.kind === 'preview' && <TemplatePreview template={open.row} />}
        {open?.kind === 'versions' && (
          <TemplateVersions template={open.row} onRestored={() => refetch()} />
        )}
      </CrudDialog>
    </Box>
  );
}
