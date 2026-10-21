import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { YStack } from 'tamagui';
import {
  ATTENDANCE_OPTIONS,
  isLocationUnavailable,
  messageOf,
  trackerErrorText,
  type AttendanceLocationFallback,
  type AttendancePlace,
  type TrackerLocationInput,
  type Workday,
} from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { SelectField } from '../../components/form/SelectField';
import { TextField } from '../../components/form/TextField';
import { LocationFallbackSheet } from '../../components/location/LocationFallbackSheet';
import { LocationMapSheet } from '../../components/location/LocationMapSheet';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { tracker } from '../../tracker/instance';
import { ATTENDANCE_NOTE_MAX, attendanceSchema } from './attendance.schema';
import type { AttendanceValues } from './attendance.types';

const LOCATE_FAILED = 'Could not read your location.';
const FAILED = 'Could not mark your attendance.';

/** The answers, held while the employee checks the pin they are about to be marked in at. */
interface Pending {
  values: AttendanceValues;
  pin: TrackerLocationInput;
}

const DEFAULT_VALUES: AttendanceValues = { status: 'PRESENT', note: '' };

type Sending = 'mark' | AttendanceLocationFallback;

interface Props {
  /** Today, so a refusal for an off day is worded as the off-day banner words it. */
  workday: Workday;
}

/**
 * Marking in for the day — the gate tracking sits behind. The same record as the employee
 * portal's own "Mark attendance": on success the tracker publishes the marked workday, and the
 * gate above this form swaps it for a one-line "Marked in today" by itself. Where the employee
 * is gets pinned with it: the fix is shown on a map to confirm first, and the confirmed fix
 * is the one sent — never read again. When no location can be read, a sheet says why and
 * lets them mark in anyway — at their profile address, or without a location.
 */
export function AttendanceForm({ workday }: Readonly<Props>) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  /** The location error that opened the fallback sheet; null while it is closed. */
  const [failure, setFailure] = useState<string | null>(null);
  /** The answers last submitted — what a fallback is sent with. */
  const [held, setHeld] = useState<AttendanceValues>(DEFAULT_VALUES);
  const [sending, setSending] = useState<Sending | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const opener = useRef<View>(null);
  const statusOptions = useMemo(
    () => ATTENDANCE_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) })),
    [t],
  );
  const { control, handleSubmit, formState } = useForm<AttendanceValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const busy = formState.isSubmitting;
  const errorText = (cause: unknown, fallback: string): string =>
    trackerErrorText(messageOf(cause, t(fallback)), workday, t);

  // Locating is the submit's own work, so the button's spinner covers it.
  const submit = handleSubmit(async (values) => {
    setError(null);
    setFailure(null);
    setMarkError(null);
    setHeld(values);
    try {
      setPending({ values, pin: await tracker.readLocation() });
    } catch (cause: unknown) {
      console.error('Reading the location for attendance failed', cause);
      const message = messageOf(cause, '');
      if (isLocationUnavailable(message)) {
        setFailure(message);
      } else {
        setError(errorText(cause, LOCATE_FAILED));
      }
    }
  });
  const resubmit = (): void => {
    submit().catch((cause: unknown) => console.error('Mark attendance failed', cause));
  };

  // Sends the pin that was shown — never a fresh read — or the chosen fallback, with the answers.
  const send = async (values: AttendanceValues, place: AttendancePlace): Promise<void> => {
    setSending(typeof place === 'string' ? place : 'mark');
    setMarkError(null);
    try {
      await tracker.markAttendance(values.status, values.note === '' ? null : values.note, place);
      setPending(null);
      setFailure(null);
    } catch (cause: unknown) {
      console.error('Mark attendance failed', cause);
      setMarkError(errorText(cause, FAILED));
    } finally {
      setSending(null);
    }
  };
  const sendLater = (values: AttendanceValues, place: AttendancePlace): void => {
    send(values, place).catch((cause: unknown) => console.error('Mark attendance failed', cause));
  };

  return (
    <YStack gap="$3">
      <Notice severity="info">
        {t('Mark your attendance for today before you start tracking.')}
      </Notice>
      <SelectField
        control={control}
        name="status"
        label={t('Attendance')}
        options={statusOptions}
        disabled={busy}
      />
      <TextField
        control={control}
        name="note"
        label={t('Note (optional)')}
        hint={t('Anything HR should know about today — up to {max} characters.', {
          max: ATTENDANCE_NOTE_MAX,
        })}
        disabled={busy}
      />
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <View ref={opener}>
        <AppButton
          label={t('Mark attendance')}
          icon="account-check-outline"
          busy={busy}
          full
          onPress={resubmit}
        />
      </View>
      <LocationFallbackSheet
        failure={failure}
        profileAddress={workday.profileAddress}
        marking={sending === 'mark' ? null : sending}
        error={markError}
        onRetry={resubmit}
        onFallback={(fallback) => sendLater(held, fallback)}
        onClose={() => setFailure(null)}
        returnFocusTo={opener}
      />
      <LocationMapSheet
        pin={pending?.pin ?? null}
        description={t(
          'Your attendance is marked with this location. Is this where you are working from?',
        )}
        onClose={() => setPending(null)}
        onConfirm={pending === null ? undefined : () => sendLater(pending.values, pending.pin)}
        busy={sending === 'mark'}
        error={markError}
        returnFocusTo={opener}
      />
    </YStack>
  );
}
