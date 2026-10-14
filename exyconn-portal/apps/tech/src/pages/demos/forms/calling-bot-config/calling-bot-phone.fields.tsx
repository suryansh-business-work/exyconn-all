import { Typography } from '@exyconn/shell/components/ui';
import { RhfSecretField, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { CallingBotSecret } from '@exyconn/shell/graphql/generated';
import { useT } from '@exyconn/i18n';
import { BOOL_OPTIONS, type CallingBotConfigRow } from './calling-bot-config.types';
import { VOBIZ_SOURCE } from './calling-bot-key-guide';
import { KeySourceHint } from './CallingBotKeyGuide';
import type { RevealFor } from './useSecretReveal';

interface CallingBotPhoneFieldsProps {
  initial: CallingBotConfigRow | null;
  revealFor: RevealFor;
}

/** The Vobiz account that rings real phones. Leave it empty for browser calls only. */
export function CallingBotPhoneFields({
  initial,
  revealFor,
}: Readonly<CallingBotPhoneFieldsProps>) {
  const t = useT();
  return (
    <>
      <Typography variant="subtitle2" component="h3" sx={{ mt: 1 }}>
        {t('Phone calls (Vobiz) — optional')}
      </Typography>
      <RhfTextField
        name="vobizAuthId"
        label="Vobiz Auth ID"
        helperText={<KeySourceHint source={VOBIZ_SOURCE} />}
      />
      <RhfSecretField
        name="vobizAuthToken"
        label="Vobiz Auth Token"
        stored={initial?.hasVobizAuthToken}
        onReveal={revealFor(CallingBotSecret.VobizAuthToken)}
        helperText={<KeySourceHint source={VOBIZ_SOURCE} />}
      />
      <RhfTextField
        name="vobizNumber"
        label="Calling number"
        helperText="The Vobiz number calls come from, e.g. +918012345678."
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </>
  );
}
