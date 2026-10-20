import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { RhfNumberField } from '../../../components/form/RhfNumberField';
import { RhfSelect } from '../../../components/form/RhfSelect';
import { RhfSwitch } from '../../../components/form/RhfSwitch';
import { DEFAULT_PREFS, prefsSchema, SNOOZE_MINUTES } from '../../../storage/prefs';
import {
  CORNER_OPTIONS,
  PANEL_OPTIONS,
  THEME_OPTIONS,
  intervalOptions,
} from '../../settings-options';
import type {
  ExtensionSettingsFormProps,
  ExtensionSettingsValues,
} from './extension-settings.types';
import { errorText } from '../../../utils/errors';

type Outcome = { kind: 'saved' } | { kind: 'failed'; message: string } | null;

/** Hint for a switch the company has turned off for everyone. */
const COMPANY_OFF = 'Turned off by your company';

/**
 * The user's own extension settings (synced across their Chrome profiles). Validated with
 * the same schema the extension reads them back with, so a saved value is always usable.
 */
export function ExtensionSettingsForm({
  initial,
  org,
  onSave,
  requestMicrophone,
}: Readonly<ExtensionSettingsFormProps>) {
  const t = useT();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const { control, handleSubmit, reset, setError, formState } = useForm<ExtensionSettingsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });

  const submit = handleSubmit(async (values) => {
    setOutcome(null);
    try {
      await onSave(values);
      reset(values);
      setOutcome({ kind: 'saved' });
    } catch (error) {
      setOutcome({
        kind: 'failed',
        message: errorText(error, 'Could not save settings'),
      });
    }
  });

  const allowMicrophone = async (): Promise<boolean> => {
    const granted = await requestMicrophone();
    if (!granted) {
      setError('captureMicrophone', {
        message: 'Microphone permission was denied. Allow it in Chrome to record your voice too.',
      });
    }
    return granted;
  };

  const trackingOff = org?.participantTracking === false;
  const transcriptOff = org?.liveTranscript === false;
  const remindersOff = org?.remindersEnabled === false;

  return (
    <Stack
      component="form"
      noValidate
      spacing={2.5}
      onSubmit={submit}
      aria-labelledby="settings-title"
    >
      <Typography id="settings-title" variant="h6" component="h2">
        {t('Extension settings')}
      </Typography>
      <Typography variant="subtitle2" component="h3">
        {t('In the meeting')}
      </Typography>
      <RhfSwitch
        control={control}
        name="showFloatingIcon"
        label="Show the floating assistant icon"
        hint="A small icon on the Meet page opens the assistant panel."
      />
      <RhfSelect
        control={control}
        name="iconCorner"
        label="Icon position"
        hint="Where the icon starts. You can also drag it or move it with the arrow keys."
        options={CORNER_OPTIONS}
      />
      <RhfSelect
        control={control}
        name="defaultPanelState"
        label="Panel when a meeting opens"
        hint="Whether the side panel starts collapsed or open."
        options={PANEL_OPTIONS}
      />
      <RhfSwitch
        control={control}
        name="autoOpenPanel"
        label="Open the panel when I join a call"
        hint="Expands the panel automatically once you are in the meeting."
      />
      <RhfSwitch
        control={control}
        name="liveTranscript"
        label="Show the live transcript"
        hint={transcriptOff ? COMPANY_OFF : 'Shows transcript lines in the panel while it is open.'}
        disabled={transcriptOff}
      />
      <RhfSwitch
        control={control}
        name="participantTracking"
        label="Track participants"
        hint={
          trackingOff ? COMPANY_OFF : 'Records who joined and left, from the names visible in Meet.'
        }
        disabled={trackingOff}
      />
      <RhfSwitch
        control={control}
        name="captureMicrophone"
        label="Also record my microphone"
        hint="Records your voice as a separate stream when you start transcription."
        beforeEnable={allowMicrophone}
      />
      <Typography variant="subtitle2" component="h3">
        {t('Reminders')}
      </Typography>
      <RhfSwitch
        control={control}
        name="desktopNotifications"
        label="Desktop notifications"
        hint={
          remindersOff
            ? COMPANY_OFF
            : 'Also remind me with a Chrome notification, not only in the page.'
        }
        disabled={remindersOff}
      />
      <RhfSelect
        control={control}
        name="reminderInterval"
        label="Remind me"
        hint="How often to remind you while Meet transcription is off."
        options={intervalOptions(org?.reminderIntervalMinutes ?? null)}
      />
      <RhfNumberField
        control={control}
        name="snoozeMinutes"
        label="Snooze length (minutes)"
        hint="How long Snooze silences reminders, from 5 to 120 minutes."
        min={SNOOZE_MINUTES.min}
        max={SNOOZE_MINUTES.max}
      />
      <Typography variant="subtitle2" component="h3">
        {t('Appearance')}
      </Typography>
      <RhfSelect
        control={control}
        name="theme"
        label="Theme"
        hint="The assistant's colours in Meet, the popup and here."
        options={THEME_OPTIONS}
      />
      <Box aria-live="polite">
        {outcome?.kind === 'saved' ? <Alert severity="success">{t('Settings saved')}</Alert> : null}
        {outcome?.kind === 'failed' ? <Alert severity="error">{t(outcome.message)}</Alert> : null}
      </Box>
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={formState.isSubmitting}>
          {t('Save settings')}
        </Button>
        <Button
          type="button"
          onClick={() => reset(DEFAULT_PREFS)}
          disabled={formState.isSubmitting}
        >
          {t('Reset to defaults')}
        </Button>
      </Stack>
    </Stack>
  );
}
