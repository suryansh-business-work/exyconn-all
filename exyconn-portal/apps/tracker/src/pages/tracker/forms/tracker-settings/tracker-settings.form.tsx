import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfSwitch,
  RhfRichText,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdateTrackerSettingsMutation } from '@exyconn/shell/graphql/generated';
import { isValidTimezone } from '../../tracker.timezone';
import { buildTimezoneOptions } from './timezone.options';
import type { TrackerSettingsRow } from './tracker-settings.types';

const schema = z.object({
  intervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  screenshotsPerInterval: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(10),
  idleThresholdSeconds: z.coerce.number({ message: 'Enter a number' }).int().min(10).max(3600),
  screenshotMaxWidth: z.coerce.number({ message: 'Enter a number' }).int().min(320).max(3840),
  screenshotQuality: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(100),
  syncIntervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  randomizeScreenshotTiming: z.boolean(),
  blurScreenshots: z.boolean(),
  trackWindowTitles: z.boolean(),
  autoSyncEnabled: z.boolean(),
  consentText: z.string().min(1, 'Consent text is required'),
  defaultTimezone: z
    .string()
    .refine((value) => value === '' || isValidTimezone(value), 'Choose a valid IANA timezone'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: TrackerSettingsRow): Values => ({
  intervalMinutes: row.intervalMinutes,
  screenshotsPerInterval: row.screenshotsPerInterval,
  idleThresholdSeconds: row.idleThresholdSeconds,
  screenshotMaxWidth: row.screenshotMaxWidth,
  screenshotQuality: row.screenshotQuality,
  syncIntervalMinutes: row.syncIntervalMinutes,
  randomizeScreenshotTiming: row.randomizeScreenshotTiming,
  blurScreenshots: row.blurScreenshots,
  trackWindowTitles: row.trackWindowTitles,
  autoSyncEnabled: row.autoSyncEnabled,
  consentText: row.consentText,
  defaultTimezone: row.defaultTimezone,
});

interface TrackerSettingsFormProps {
  initial: TrackerSettingsRow;
}

/** React Hook Form + Zod form editing the global tracker capture settings. */
export function TrackerSettingsForm({ initial }: Readonly<TrackerSettingsFormProps>) {
  const notify = useNotify();
  const [updateSettings] = useUpdateTrackerSettingsMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(initial.defaultTimezone),
    [initial.defaultTimezone],
  );

  const onSubmit = async (values: Values) => {
    try {
      await updateSettings({ variables: { input: values } });
      notify('Tracker settings saved');
      methods.reset(values);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={() => methods.reset()}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RhfTextField name="intervalMinutes" label="Interval (minutes)" type="number" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField
            name="screenshotsPerInterval"
            label="Screenshots / interval"
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField name="idleThresholdSeconds" label="Idle threshold (s)" type="number" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField name="screenshotMaxWidth" label="Screenshot max width" type="number" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField name="screenshotQuality" label="Screenshot quality" type="number" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField
            name="syncIntervalMinutes"
            label="Auto-sync every (minutes)"
            type="number"
            helperText="How often the desktop app uploads queued activity and screenshots."
          />
        </Grid>
      </Grid>
      <RhfAutocomplete
        name="defaultTimezone"
        label="Default timezone"
        options={timezoneOptions}
        helperText="Applied to every employee who has not picked a timezone in the desktop app."
      />
      <RhfSwitch name="randomizeScreenshotTiming" label="Randomize screenshot timing" />
      <RhfSwitch name="blurScreenshots" label="Blur screenshots" />
      <RhfSwitch name="trackWindowTitles" label="Track window titles" />
      <RhfSwitch name="autoSyncEnabled" label="Auto-sync (off = employee syncs manually)" />
      <RhfRichText
        name="consentText"
        label="Consent disclosure (shown in the desktop app)"
        helperText="The employee must read and accept this before any tracking starts."
      />
    </EntityForm>
  );
}
