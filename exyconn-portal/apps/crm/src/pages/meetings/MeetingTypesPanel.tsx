import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { appUrl } from '@exyconn/shell/config/apps';
import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteMeetingTypeMutation,
  useMeetingTypesQuery,
} from '@exyconn/shell/graphql/generated';
import { MeetingTypeForm, type MeetingTypeRow } from './forms/meeting-type';
import { BookingPageLink } from './BookingPageLink';

/** A public booking address on the CRM site, which needs no sign-in (/book/<company>/<link>). */
export const bookingLink = (path: string) => appUrl('crm', path);

/** Meetings > Meeting types: what people can book, for how long, and when. */
export function MeetingTypesPanel() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, refetch } = useMeetingTypesQuery();
  const [deleteType] = useDeleteMeetingTypeMutation();
  const crud = useCrudResource<MeetingTypeRow>({
    label: 'Meeting type',
    onDelete: (row) => deleteType({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete meeting type "{title}"? Its booking link stops working.',
      values: { title: row.title },
    }),
    refetch,
  });

  const copy = (row: MeetingTypeRow) => {
    globalThis.navigator.clipboard
      .writeText(bookingLink(row.bookingPath))
      .then(() => notify('Booking link copied', 'success'))
      .catch((error: unknown) => {
        portalLogger.warn('crm: copying a booking link failed', error);
        notify('Could not copy the link', 'error');
      });
  };
  const actions: RowAction<MeetingTypeRow>[] = [
    {
      icon: <ContentCopyIcon fontSize="small" />,
      tooltip: 'Copy booking link',
      ariaLabel: 'copy booking link',
      onClick: copy,
    },
    {
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: 'Open booking page',
      ariaLabel: 'open booking page',
      onClick: (row) => globalThis.open(bookingLink(row.bookingPath), '_blank', 'noopener'),
    },
  ];
  const columns: Column<MeetingTypeRow>[] = [
    { key: 'title', label: 'Meeting' },
    {
      key: 'durationMinutes',
      label: 'Length',
      render: (r) => t('{minutes} min', { minutes: r.durationMinutes }),
    },
    { key: 'slug', label: 'Link', render: (r) => r.bookingPath },
    { key: 'hostName', label: 'Host' },
    {
      key: 'active',
      label: 'Open',
      render: (r) => <StatusChip value={r.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit meeting type' : 'New meeting type'}
        onBack={crud.close}
        backLabel="Back to meeting types"
      >
        <MeetingTypeForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }
  return (
    <Box>
      <PageHeader
        title="Meeting types"
        subtitle="Share a link; people pick a free time from your availability"
        actionLabel="New meeting type"
        onAction={crud.openCreate}
      />
      <BookingPageLink />
      <DataTable
        columns={columns}
        rows={data?.meetingTypes ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No meeting types yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
