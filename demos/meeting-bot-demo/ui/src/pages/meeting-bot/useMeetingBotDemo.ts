import { useCallback, useEffect } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  MaBotStatus,
  useCancelMeetingBotDemoMutation,
  useMeetingBotDemoInfoQuery,
  useMeetingBotDemoTripsQuery,
  useSendMeetingBotDemoMutation,
  type MeetingBotDemoTripFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { MeetingBotTripValues } from '../../forms/meeting-bot-trip';

export type DemoTrip = MeetingBotDemoTripFieldsFragment;

/** How often the trips are re-read while a bot is on its way, in a call or writing notes. */
export const POLL_MS = 10_000;
const REFETCH = ['MeetingBotDemoTrips', 'MeetingBotDemoInfo'];
const BOT_FINISHED = new Set<MaBotStatus>([
  MaBotStatus.Done,
  MaBotStatus.Failed,
  MaBotStatus.Cancelled,
]);
/** Where the notes stop moving: written, failed or not made at all. */
const NOTES_SETTLED = new Set(['READY', 'FAILED', 'SKIPPED']);

/** Whether a trip can still change: the bot still busy, or its notes still being written. */
export function isMoving(trip: DemoTrip): boolean {
  if (trip.purged) {
    return false;
  }
  if (!BOT_FINISHED.has(trip.status)) {
    return true;
  }
  return trip.status === MaBotStatus.Done && !NOTES_SETTLED.has(trip.summaryStatus);
}

/**
 * The demo's data: its limits and terms, the visitor's own trips (re-read while any is still
 * moving), sending the bot and calling it back, each telling the visitor how it went.
 */
export function useMeetingBotDemo() {
  const notify = useNotify();
  const confirm = useConfirm();
  const info = useMeetingBotDemoInfoQuery({ fetchPolicy: 'cache-and-network' });
  const trips = useMeetingBotDemoTripsQuery({ fetchPolicy: 'cache-and-network' });
  const rows = trips.data?.meetingBotDemoTrips ?? [];
  const moving = rows.some(isMoving);
  const { startPolling, stopPolling } = trips;
  useEffect(() => {
    if (moving) {
      startPolling(POLL_MS);
    }
    return stopPolling;
  }, [moving, startPolling, stopPolling]);
  const [sendBot, { loading: sending }] = useSendMeetingBotDemoMutation();
  const [cancelBot] = useCancelMeetingBotDemoMutation();

  const send = useCallback(
    async (values: MeetingBotTripValues) => {
      try {
        await sendBot({ variables: values, refetchQueries: REFETCH, awaitRefetchQueries: true });
        notify('The bot is on its way. Admit it when it asks to join.', 'success');
        return true;
      } catch (error) {
        notify(errorMessage(error, 'The bot could not be sent. Try again.'), 'error');
        return false;
      }
    },
    [notify, sendBot],
  );

  const callBack = useCallback(
    async (trip: DemoTrip) => {
      const ok = await confirm({
        title: 'Call the bot back?',
        message: 'The bot leaves {code}.',
        messageValues: { code: trip.meetingCode },
        confirmText: 'Call back',
        destructive: true,
      });
      if (!ok) {
        return;
      }
      try {
        await cancelBot({ variables: { id: trip.id }, refetchQueries: REFETCH });
        notify('The bot was called back', 'success');
      } catch (error) {
        notify(errorMessage(error, 'The bot could not be called back. Try again.'), 'error');
      }
    },
    [cancelBot, confirm, notify],
  );

  return {
    info: info.data?.meetingBotDemoInfo ?? null,
    infoError: info.error?.message ?? null,
    retryInfo: () => info.refetch(),
    trips: rows,
    tripsLoading: trips.loading && !trips.data,
    tripsError: trips.error?.message ?? null,
    retryTrips: () => trips.refetch(),
    sending,
    send,
    callBack,
  };
}

export type MeetingBotDemo = ReturnType<typeof useMeetingBotDemo>;
