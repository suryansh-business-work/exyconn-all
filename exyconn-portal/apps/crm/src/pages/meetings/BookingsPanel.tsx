import EventBusyIcon from '@mui/icons-material/EventBusy';
import { Link as RouterLink } from 'react-router-dom';
import { useFormatters } from '@exyconn/i18n';
import { Box, Link } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  MeetingBookingStatus,
  useCancelMeetingBookingMutation,
  useMeetingBookingsQuery,
  type MeetingBookingFieldsFragment,
} from '@exyconn/shell/graphql/generated';

type Booking = MeetingBookingFieldsFragment;
const PAGE_SIZE = 100;

/** Meetings > Bookings: who booked what and when, newest first; a booking can be cancelled. */
export function BookingsPanel() {
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDateTime } = useFormatters();
  const { data, loading, refetch } = useMeetingBookingsQuery({
    variables: { page: 0, pageSize: PAGE_SIZE },
  });
  const [cancelBooking] = useCancelMeetingBookingMutation();

  const cancel = async (row: Booking) => {
    const ok = await confirm({
      title: 'Cancel booking',
      message: 'Cancel {name}’s {meeting}? The time becomes free again.',
      messageValues: { name: row.name, meeting: row.meetingTitle },
      confirmText: 'Cancel booking',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await cancelBooking({ variables: { id: row.id } });
      notify('Booking cancelled', 'success');
    } catch (error) {
      portalLogger.warn('crm: cancelling a booking failed', error);
      notify(errorMessage(error, 'Could not cancel the booking'), 'error');
    }
  };
  const actions: RowAction<Booking>[] = [
    {
      icon: <EventBusyIcon fontSize="small" />,
      tooltip: 'Cancel booking',
      ariaLabel: 'cancel booking',
      color: 'error',
      hidden: (row) => row.status === MeetingBookingStatus.Cancelled,
      onClick: (row) => {
        cancel(row).catch((error: unknown) => portalLogger.warn('crm: cancel failed', error));
      },
    },
  ];
  const columns: Column<Booking>[] = [
    { key: 'startAt', label: 'When', render: (r) => formatDateTime(r.startAt) },
    { key: 'meetingTitle', label: 'Meeting' },
    {
      key: 'name',
      label: 'With',
      render: (r) =>
        r.contactId ? (
          <Link component={RouterLink} to={`/crm/contacts/${r.contactId}`}>
            {r.name}
          </Link>
        ) : (
          r.name
        ),
    },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];
  return (
    <Box>
      <PageHeader
        title="Bookings"
        subtitle={`Meetings booked from your links (the latest ${PAGE_SIZE})`}
      />
      <DataTable
        columns={columns}
        rows={data?.meetingBookings.rows ?? []}
        actions={actions}
        emptyMessage="No bookings yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
