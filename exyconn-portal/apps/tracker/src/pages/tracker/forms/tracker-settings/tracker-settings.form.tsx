import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Box, FormHelperText } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfSelect, RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdateTrackerSettingsMutation } from '@exyconn/shell/graphql/generated';
import { buildTimezoneOptions } from './timezone.options';
import { WEBCAM_CORNER_OPTIONS } from './webcam.options';
import { CaptureFields } from './capture-fields';
import { CaptureSoundFields } from './capture-sound';
import { ConsentDisclosureFields } from './consent-disclosure';
import { DigestScheduleFields } from './digest-schedule';
import { AutoStartScheduleFields } from './auto-start-schedule';
import {
  toInitial,
  trackerSettingsSchema,
  type TrackerSettingsValues,
} from './tracker-settings.schema';
import type { TrackerSettingsRow } from './tracker-settings.types';

interface TrackerSettingsFormProps {
  initial: TrackerSettingsRow;
}

/** React Hook Form + Zod form editing the global tracker capture settings. */
export function TrackerSettingsForm({ initial }: Readonly<TrackerSettingsFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [updateSettings] = useUpdateTrackerSettingsMutation();
  const methods = useForm<z.input<typeof trackerSettingsSchema>, unknown, TrackerSettingsValues>({
    resolver: zodResolver(trackerSettingsSchema),
    defaultValues: toInitial(initial),
  });
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(initial.defaultTimezone),
    [initial.defaultTimezone],
  );
  // The corner only means anything when a photo is actually being taken.
  const webcamEnabled = methods.watch('webcamEnabled');

  const onSubmit = async (values: TrackerSettingsValues) => {
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
      <CaptureFields />
      <RhfAutocomplete
        name="defaultTimezone"
        label="Default timezone"
        options={timezoneOptions}
        helperText="Applied to every employee who has not picked a timezone in the desktop app."
      />
      <RhfSwitch name="randomizeScreenshotTiming" label="Randomize screenshot timing" />
      <RhfSwitch name="blurScreenshots" label="Blur screenshots" />
      <RhfSwitch name="trackWindowTitles" label="Track window titles" />
      <CaptureSoundFields />
      <Box>
        <RhfSwitch name="webcamEnabled" label="Webcam photo with each screenshot" />
        <FormHelperText>
          {t(
            'Photographs the employee. The desktop app discloses it on the consent screen, announces every capture, and macOS asks for camera access before the first one.',
          )}
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
