import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useT } from '@exyconn/i18n';
import { Box, Button, Typography } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { meetingBotTripSchema, type MeetingBotTripValues } from './meeting-bot-trip.types';

interface MeetingBotTripFormProps {
  /** The recording terms the visitor agrees to, as the server words them. */
  consentText: string;
  busy: boolean;
  disabled: boolean;
  /** Sends the bot, resolving to whether it worked so the form can clear. */
  onSend: (values: MeetingBotTripValues) => Promise<boolean>;
}

const EMPTY: MeetingBotTripValues = { meetUrl: '', consent: false };

/** The Google Meet link to join, the recording terms, and the button that sends the bot. */
export function MeetingBotTripForm({
  consentText,
  busy,
  disabled,
  onSend,
}: Readonly<MeetingBotTripFormProps>) {
  const t = useT();
  const form = useForm<MeetingBotTripValues>({
    resolver: zodResolver(meetingBotTripSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });
  const submit = async (values: MeetingBotTripValues) => {
    if (await onSend(values)) {
      form.reset(EMPTY);
    }
  };
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'grid', gap: 2 }}
        onSubmit={form.handleSubmit(submit)}
      >
        <RhfTextField
          name="meetUrl"
          label="Google Meet link"
          placeholder="https://meet.google.com/abc-defg-hij"
          helperText="Start or open your call first. The bot asks to join; admit it from the call."
          inputMode="url"
          autoComplete="off"
        />
        <Typography variant="body2" color="text.secondary">
          {t(consentText)}
        </Typography>
        <RhfSwitch name="consent" label="I agree to these recording terms" />
        <Button
          type="submit"
          variant="contained"
          startIcon={<VideoCallIcon />}
          disabled={busy || disabled}
        >
          {t('Send the bot to my call')}
        </Button>
      </Box>
    </FormProvider>
  );
}
