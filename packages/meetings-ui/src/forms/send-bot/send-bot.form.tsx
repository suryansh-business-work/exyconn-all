import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { GOOGLE_MEET_URL } from '@exyconn/regex';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import type { SendBotValues } from './send-bot.types';

const schema = z.object({
  meetUrl: z
    .string()
    .trim()
    .min(1, 'Paste the Google Meet link')
    .regex(GOOGLE_MEET_URL, 'Use a Google Meet link, like https://meet.google.com/abc-defg-hij'),
  title: z.string().trim().max(300, 'At most 300 characters'),
});

const EMPTY: SendBotValues = { meetUrl: '', title: '' };

interface SendBotFormProps {
  /** Sends the bot, resolving to whether it worked so the form can clear. */
  onSubmit: (values: SendBotValues) => Promise<boolean>;
}

/** Sends the meeting bot into a Google Meet call to record it as the viewer's meeting. */
export function SendBotForm({ onSubmit }: Readonly<SendBotFormProps>) {
  const methods = useForm<SendBotValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const submit = async (values: SendBotValues) => {
    if (await onSubmit(values)) {
      methods.reset(EMPTY);
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={() => methods.reset(EMPTY)}
      submitLabel="Send bot"
    >
      <RhfTextField
        name="meetUrl"
        label="Google Meet link"
        required
        placeholder="https://meet.google.com/abc-defg-hij"
        helperText="The bot asks to join; the host may have to admit it."
      />
      <RhfTextField
        name="title"
        label="Meeting title"
        helperText="Optional; the title Meet shows is used when empty."
      />
    </EntityForm>
  );
}
