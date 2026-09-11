import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { YStack } from 'tamagui';
import { TextField } from '../../components/form/TextField';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { consentSchema } from './consent.schema';
import type { ConsentInput, ConsentValues } from './consent.types';

const RECORD_FAILED = 'Could not record your agreement.';
const SIGN_OUT_FAILED = 'Could not sign out. Check your connection and try again.';

interface Props {
  /** The policy must be signed, not just accepted. */
  mustSign: boolean;
  /** False when nothing has been disclosed — there is nothing to agree to yet. */
  canAgree: boolean;
}

/**
 * Agree or decline. Agreeing records consent (and, for a signed policy, the signature in
 * Legal's ledger against the version shown); the tracker then moves on by itself. Declining
 * signs out — there is nothing else to do without consent, and nothing has been recorded.
 */
export function ConsentForm({ mustSign, canAgree }: Readonly<Props>) {
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const schema = useMemo(() => consentSchema(mustSign), [mustSign]);
  const { control, handleSubmit, formState } = useForm<ConsentInput, unknown, ConsentValues>({
    resolver: zodResolver(schema),
    defaultValues: { signedName: '' },
  });
  const busy = formState.isSubmitting || leaving;

  const agree = handleSubmit(async (values) => {
    setError(null);
    try {
      await tracker.acceptConsent(values.signedName);
    } catch (cause: unknown) {
      console.error('Failed to record consent', cause);
      setError(messageOf(cause, RECORD_FAILED));
    }
  });

  async function decline(): Promise<void> {
    setError(null);
    setLeaving(true);
    try {
      await tracker.logout();
      // On success the tracker publishes `signed-out` and this screen unmounts.
    } catch (cause: unknown) {
      console.error('Failed to sign out', cause);
      setError(messageOf(cause, SIGN_OUT_FAILED));
      setLeaving(false);
    }
  }

  return (
    <YStack gap="$3">
      {mustSign ? (
        <TextField
          control={control}
          name="signedName"
          label="Type your full name to sign"
          hint="Recorded against this version of the policy, and visible to Legal and HR."
          autoComplete="name"
          autoCapitalize="words"
          disabled={busy}
        />
      ) : null}
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <AppButton
        label={mustSign ? 'Sign and agree' : 'I understand and agree'}
        icon="check-circle-outline"
        full
        busy={formState.isSubmitting}
        disabled={busy || !canAgree}
        onPress={() => {
          agree().catch((cause: unknown) => console.error('Agreeing failed', cause));
        }}
      />
      <AppButton
        label="Not now"
        tone="text"
        full
        busy={leaving}
        disabled={busy}
        accessibilityLabel="Not now — sign out"
        onPress={() => {
          decline().catch((cause: unknown) => console.error('Declining failed', cause));
        }}
      />
    </YStack>
  );
}
