import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { isLocationUnavailable } from '@exyconn/tracker-core';
import type {
  AttendanceLocationFallback,
  AttendancePlace,
  AttendanceStatus,
  TrackerLocationInput,
} from '@shared/types';
import { messageOf, run } from '../run';
import usePendingAction from './usePendingAction';

type Action = 'locate' | 'mark' | AttendanceLocationFallback;

/**
 * Marking in for the day, step by step: read the location, then either confirm the pin on a
 * map (`fix`) or — when no location could be read — choose a fallback (`failure` holds the
 * location error that opened that choice). Only one step runs at a time.
 */
export default function useAttendanceMark(status: AttendanceStatus, note: string) {
  const t = useT();
  const [fix, setFix] = useState<TrackerLocationInput | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { pending, error, perform, clearError } = usePendingAction<Action>();

  const locate = (): Promise<boolean> =>
    perform(
      'locate',
      async () => {
        try {
          setFix(await globalThis.tracker.getLocation());
        } catch (cause: unknown) {
          const message = messageOf(cause, '');
          if (!isLocationUnavailable(message)) {
            throw cause;
          }
          console.error('Reading the location for attendance failed', cause);
          setFailure(message);
        }
      },
      t('Could not read your location.'),
    );

  const mark = async (place: AttendancePlace): Promise<void> => {
    const marked = await perform(
      typeof place === 'string' ? place : 'mark',
      () => globalThis.tracker.markAttendance(status, note.trim() || null, place),
      t('Could not mark your attendance.'),
    );
    if (marked) {
      setFix(null);
      setFailure(null);
    }
  };

  const cancel = (): void => {
    setFix(null);
    setFailure(null);
    clearError();
  };

  const retry = (): void => {
    setFailure(null);
    run(locate);
  };

  const marking = pending === 'PROFILE_ADDRESS' || pending === 'NONE' ? pending : null;

  return { fix, failure, pending, marking, error, locate, mark, cancel, retry };
}
