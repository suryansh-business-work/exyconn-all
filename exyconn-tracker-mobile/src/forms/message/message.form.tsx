import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { Input, XStack, YStack } from 'tamagui';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { messageOf } from '../../tracker/run';
import { MESSAGE_MAX_CHARS, messageSchema } from './message.schema';
import type { MessageInput, MessageValues } from './message.types';

const SEND_FAILED = 'Your message could not be sent. Check your connection and try again.';

/** Tall enough for four lines, then the box scrolls instead of eating the thread. */
const MAX_INPUT_HEIGHT = 120;

interface Props {
  /** Resolves once the portal has taken the message; rejects with the reason it did not. */
  onSend: (body: string) => Promise<void>;
}

/**
 * Where the employee writes back.
 *
 * A compact composer rather than a labelled form field: it sits under the thread with the
 * keyboard open, where a label and a tall box would leave no room for the conversation.
 * The return key starts a new line, as in every phone chat; Send sends. The box only clears
 * once the portal has taken the message — clearing on the press would lose what somebody
 * typed the first time their signal dropped.
 */
export function MessageForm({ onSend }: Readonly<Props>) {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState } = useForm<MessageInput, unknown, MessageValues>(
    {
      resolver: zodResolver(messageSchema),
      defaultValues: { body: '' },
    },
  );
  const { field, fieldState } = useController({ control, name: 'body' });
  const busy = formState.isSubmitting;
  const canSend = field.value.trim() !== '' && !busy;
  const problem = error ?? fieldState.error?.message;

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await onSend(values.body);
      reset({ body: '' });
    } catch (cause: unknown) {
      console.error('Sending the message failed', cause);
      setError(messageOf(cause, SEND_FAILED));
    }
  });

  return (
    <YStack gap="$2">
      {problem === undefined ? null : <Notice severity="error">{problem}</Notice>}
      <XStack gap="$2" alignItems="flex-end">
        <Input
          flex={1}
          multiline
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          maxLength={MESSAGE_MAX_CHARS}
          maxHeight={MAX_INPUT_HEIGHT}
          placeholder="Write to your workspace…"
          disabled={busy}
          textAlignVertical="top"
          borderRadius={TRACKER_RADIUS}
          borderColor={fieldState.error === undefined ? '$hairline' : '$error'}
          backgroundColor="$paper"
          color="$ink"
          accessibilityLabel="Message"
          aria-invalid={fieldState.error !== undefined}
        />
        <AppButton
          label="Send"
          icon="send"
          busy={busy}
          disabled={!canSend}
          accessibilityLabel="Send message"
          onPress={() => {
            submit().catch((cause: unknown) => console.error('Sending the message failed', cause));
          }}
        />
      </XStack>
    </YStack>
  );
}
