import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingBookingStatus } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { BookingsPanel } from '../../../../src/pages/meetings/BookingsPanel';
import { renderWithProviders } from '../../test-utils';
import { pending } from '../../fixtures';
import { bookingRow } from './meetings-fixtures';

const gql = vi.hoisted(() => ({
  bookings: vi.fn(),
  bookingsArgs: vi.fn(),
  refetch: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingBookingsQuery: (options: unknown) => {
    gql.bookingsArgs(options);
    return gql.bookings();
  },
  useCancelMeetingBookingMutation: () => [gql.cancel],
}));

const confirmState = vi.hoisted(() => ({ broken: false }));

// The real confirm dialog, unless a test needs the dialog itself to fail.
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return {
    ...real,
    useConfirm: () => {
      const confirm = real.useConfirm();
      return confirmState.broken ? () => Promise.reject(new Error('dialog gone')) : confirm;
    },
  };
});

const linked = bookingRow({ id: 'booking-2', name: 'Ana Ruiz', contactId: 'contact-7' });
const cancelled = bookingRow({
  id: 'booking-3',
  name: 'Bo Chen',
  status: MeetingBookingStatus.Cancelled,
});

function rowOf(name: string) {
  const row = screen.getByText(name).closest('tr');
  if (!row) throw new Error(`No row for ${name}`);
  return within(row);
}

async function cancelRow(name: string) {
  await userEvent.click(rowOf(name).getByRole('button', { name: 'cancel booking' }));
  return screen.findByRole('dialog');
}

describe('BookingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmState.broken = false;
    gql.refetch.mockResolvedValue({});
    gql.cancel.mockResolvedValue({ data: { cancelMeetingBooking: true } });
    gql.bookings.mockReturnValue({
      data: { meetingBookings: { totalCount: 3, rows: [bookingRow(), linked, cancelled] } },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('asks for the latest 100 bookings and says so', () => {
    renderWithProviders(<BookingsPanel />);

    expect(gql.bookingsArgs).toHaveBeenCalledWith({ variables: { page: 0, pageSize: 100 } });
    expect(screen.getByText('Meetings booked from your links (the latest 100)')).toBeVisible();
  });

  it('links a booking to its contact when there is one, and shows the status', () => {
    renderWithProviders(<BookingsPanel />);

    expect(screen.getByRole('link', { name: 'Ana Ruiz' })).toHaveAttribute(
      'href',
      '/contacts/contact-7',
    );
    expect(screen.queryByRole('link', { name: 'Sam Lee' })).not.toBeInTheDocument();
    expect(rowOf('Sam Lee').getByText('CONFIRMED')).toBeInTheDocument();
    expect(rowOf('Sam Lee').getByText('sam@globex.com')).toBeInTheDocument();
    expect(rowOf('Sam Lee').getByText('20 Oct 2026 09:30 AM')).toBeInTheDocument();
  });

  it('offers no cancel on a booking already cancelled', () => {
    renderWithProviders(<BookingsPanel />);

    expect(rowOf('Bo Chen').queryByRole('button', { name: 'cancel booking' })).toBeNull();
    expect(rowOf('Sam Lee').getByRole('button', { name: 'cancel booking' })).toBeVisible();
  });

  it('shows placeholder rows while loading and an empty message after', () => {
    gql.bookings.mockReturnValue({ ...pending(), refetch: gql.refetch });
    const { unmount } = renderWithProviders(<BookingsPanel />);
    expect(screen.queryByText('No bookings yet.')).not.toBeInTheDocument();
    unmount();

    gql.bookings.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<BookingsPanel />);
    expect(screen.getByText('No bookings yet.')).toBeInTheDocument();
  });

  it('cancels a booking by id once confirmed', async () => {
    renderWithProviders(<BookingsPanel />);

    const dialog = await cancelRow('Sam Lee');
    expect(
      within(dialog).getByText('Cancel Sam Lee’s Intro call? The time becomes free again.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    expect(gql.cancel).toHaveBeenCalledWith({ variables: { id: 'booking-1' } });
    expect(await screen.findByText('Booking cancelled')).toBeInTheDocument();
  });

  it('leaves the booking alone when the confirm is dismissed', async () => {
    renderWithProviders(<BookingsPanel />);

    const dialog = await cancelRow('Sam Lee');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.cancel).not.toHaveBeenCalled();
  });

  it('says why a cancel failed and logs it', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.cancel.mockRejectedValueOnce(new Error('Booking already started'));
    renderWithProviders(<BookingsPanel />);

    const dialog = await cancelRow('Sam Lee');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    expect(await screen.findByText('Booking already started')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: cancelling a booking failed', expect.any(Error));
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.cancel.mockRejectedValueOnce('offline');
    renderWithProviders(<BookingsPanel />);

    const dialog = await cancelRow('Sam Lee');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    expect(await screen.findByText('Could not cancel the booking')).toBeInTheDocument();
  });

  it('logs a cancel whose confirm dialog failed, without cancelling', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    confirmState.broken = true;
    renderWithProviders(<BookingsPanel />);

    await userEvent.click(rowOf('Sam Lee').getByRole('button', { name: 'cancel booking' }));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: cancel failed', new Error('dialog gone')),
    );
    expect(gql.cancel).not.toHaveBeenCalled();
  });
});
