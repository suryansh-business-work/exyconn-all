import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { YStack } from 'tamagui';
import { ATTENDANCE_OPTIONS } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { SelectField } from '../../components/form/SelectField';
import { TextField } from '../../components/form/TextField';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { ATTENDANCE_NOTE_MAX, attendanceSchema } from './attendance.schema';
import type { AttendanceValues } from './attendance.types';

const FAILED = 'Could not mark your attendance.';

/**
 * Marking in for the day — the gate tracking sits behind. The same record as the employee
 * portal's own "Mark attendance": on success the tracker publishes the marked workday, and the
 * gate above this form swaps it for a one-line "Marked in today" by itself.
 */
export function AttendanceForm() {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const statusOptions = useMemo(
    () => ATTENDANCE_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) })),
    [t],
  );
  const { control, handleSubmit, formState } = useForm<AttendanceValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { status: 'PRESENT', note: '' },
  });
  const busy = formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await tracker.markAttendance(values.status, values.note === '' ? null : values.note);
    } catch (cause: unknown) {
      console.error('Mark attendance failed', cause);
      setError(messageOf(cause, t(FAILED)));
    }
  });

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
      <AppButton
        label={t('Mark attendance')}
        icon="account-check-outline"
        busy={busy}
        full
        onPress={() => {
          submit().catch((cause: unknown) => console.error('Mark attendance failed', cause));
        }}
      />
    </YStack>
  );
}
