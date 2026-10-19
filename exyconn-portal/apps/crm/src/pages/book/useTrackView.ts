import { useEffect, useRef } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useTrackMeetingViewMutation } from '@exyconn/shell/graphql/generated';
import type { BookingAddress } from './useBookingAddress';
import { browserZone } from './useBookingTime';

/**
 * Counts one visit to a booking page ('' slug) or a meeting's page, once per page load. Only
 * the browser's time zone goes along, which the server turns into a country; nothing else.
 */
export function useTrackView(at: BookingAddress, slug: string, ready: boolean) {
  const [track] = useTrackMeetingViewMutation();
  const counted = useRef('');
  const key = [at.org, at.page, slug].join('/');
  useEffect(() => {
    if (!ready || counted.current === key) {
      return;
    }
    counted.current = key;
    track({ variables: { ...at, slug, timezone: browserZone() } }).catch((error: unknown) =>
      portalLogger.warn('crm: counting a booking page visit failed', error),
    );
  }, [at, key, ready, slug, track]);
}
