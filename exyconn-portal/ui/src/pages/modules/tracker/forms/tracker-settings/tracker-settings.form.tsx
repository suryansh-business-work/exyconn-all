import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Grid } from '@/components/ui';
import { RhfTextField, RhfSwitch } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUpdateTrackerSettingsMutation } from '@/graphql/generated';
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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
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
          <RhfSwitch name="randomizeScreenshotTiming" label="Randomize screenshot timing" />
          <RhfSwitch name="blurScreenshots" label="Blur screenshots" />
          <RhfSwitch name="trackWindowTitles" label="Track window titles" />
          <RhfSwitch name="autoSyncEnabled" label="Auto-sync (off = employee syncs manually)" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit
            onCancel={() => methods.reset()}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
