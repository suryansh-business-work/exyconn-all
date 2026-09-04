import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, FormHelperText, Grid } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfSwitch,
  RhfSelect,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdateTrackerSettingsMutation } from '@exyconn/shell/graphql/generated';
import { isValidTimezone } from '../../tracker.timezone';
import { buildTimezoneOptions } from './timezone.options';
import { WEBCAM_CORNERS, WEBCAM_CORNER_OPTIONS } from './webcam.options';
import { ConsentDisclosureFields } from './consent-disclosure';
import { DigestScheduleFields } from './digest-schedule';
import { AutoStartScheduleFields } from './auto-start-schedule';
import type { TrackerSettingsRow } from './tracker-settings.types';

const schema = z.object({
  intervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  screenshotsPerInterval: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(10),
  idleThresholdSeconds: z.coerce.number({ message: 'Enter a number' }).int().min(10).max(3600),
  screenshotMaxWidth: z.coerce.number({ message: 'Enter a number' }).int().min(320).max(3840),
  // 0-100. 100 is the honest top of the scale: native resolution, encoded losslessly.
  screenshotQuality: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(100),
  // 0 means "keep indefinitely" — the only value that deletes nothing.
  screenshotRetentionDays: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(3650),
  syncIntervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  randomizeScreenshotTiming: z.boolean(),
  blurScreenshots: z.boolean(),
  trackWindowTitles: z.boolean(),
  webcamEnabled: z.boolean(),
  webcamCorner: z.enum(WEBCAM_CORNERS as [string, ...string[]]),
  autoStartEnabled: z.boolean(),
  autoStartHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  autoStopHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  dailyDigestEnabled: z.boolean(),
  weeklyDigestEnabled: z.boolean(),
  digestHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  consentText: z.string().min(1, 'Consent text is required'),
  consentPolicySlug: z.string(),
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
  screenshotRetentionDays: row.screenshotRetentionDays,
  syncIntervalMinutes: row.syncIntervalMinutes,
  randomizeScreenshotTiming: row.randomizeScreenshotTiming,
  blurScreenshots: row.blurScreenshots,
  trackWindowTitles: row.trackWindowTitles,
  webcamEnabled: row.webcamEnabled,
  webcamCorner: row.webcamCorner,
  autoStartEnabled: row.autoStartEnabled,
  autoStartHour: row.autoStartHour,
  autoStopHour: row.autoStopHour,
  dailyDigestEnabled: row.dailyDigestEnabled,
  weeklyDigestEnabled: row.weeklyDigestEnabled,
  digestHour: row.digestHour,
  consentText: row.consentText,
  consentPolicySlug: row.consentPolicySlug,
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
  // The corner only means anything when a photo is actually being taken.
  const webcamEnabled = methods.watch('webcamEnabled');

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
          <RhfTextField
            name="screenshotQuality"
            label="Screenshot quality (%)"
            type="number"
            helperText="100 = native resolution, lossless. Below 100 downscales to the max width."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField
            name="screenshotRetentionDays"
            label="Delete screenshots after (days)"
            type="number"
            helperText="0 keeps them forever. Any other value deletes the image and its record once it is that old — permanently, and on a schedule."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfTextField
            name="syncIntervalMinutes"
            label="Auto-sync every (minutes)"
            type="number"
            helperText="How often the desktop app uploads queued activity and screenshots. Syncing is always automatic."
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
      <Box>
        <RhfSwitch name="webcamEnabled" label="Webcam photo with each screenshot" />
        <FormHelperText>
          Photographs the employee. The desktop app discloses it on the consent screen, announces
          every capture, and macOS asks for camera access before the first one.
        </FormHelperText>
      </Box>
      {webcamEnabled ? (
        <RhfSelect
          name="webcamCorner"
          label="Webcam photo corner"
          options={[...WEBCAM_CORNER_OPTIONS]}
          helperText="Where the photo sits on the screenshot."
        />
      ) : null}
      <AutoStartScheduleFields />
      <DigestScheduleFields />
      <ConsentDisclosureFields />
    </EntityForm>
  );
}
