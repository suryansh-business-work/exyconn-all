import { RhfSecretField, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { CallingBotKey, CallingBotSecret } from '@exyconn/shell/graphql/generated';
import type { CallingBotConfigRow } from './calling-bot-config.types';
import { TWILIO_SOURCE, VOBIZ_SOURCE } from './calling-bot-key-guide';
import { KeySourceHint } from './CallingBotKeyGuide';
import type { TestFor } from './useKeyTest';
import type { RevealFor } from './useSecretReveal';

/** What every provider's fields need: the saved row, and the eye and Test buttons. */
export interface ProviderFieldsProps {
  initial: CallingBotConfigRow | null;
  revealFor: RevealFor;
  testFor: TestFor;
}

/** A Vobiz account: rings Indian numbers from an Indian number. */
export function VobizFields({ initial, revealFor, testFor }: Readonly<ProviderFieldsProps>) {
  return (
    <>
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
        onTest={testFor(CallingBotKey.Vobiz)}
        helperText="Test checks the Auth ID and Auth Token together."
      />
      <RhfTextField
        name="vobizNumber"
        label="Calling number"
        helperText="The Vobiz number calls come from, e.g. +918012345678."
      />
    </>
  );
}

/** A Twilio account: rings numbers worldwide, within the account's geo permissions. */
export function TwilioFields({ initial, revealFor, testFor }: Readonly<ProviderFieldsProps>) {
  return (
    <>
      <RhfTextField
        name="twilioAccountSid"
        label="Twilio Account SID"
        helperText={<KeySourceHint source={TWILIO_SOURCE} />}
      />
      <RhfSecretField
        name="twilioAuthToken"
        label="Twilio Auth Token"
        stored={initial?.hasTwilioAuthToken}
        onReveal={revealFor(CallingBotSecret.TwilioAuthToken)}
        onTest={testFor(CallingBotKey.Twilio)}
        helperText="Test checks the Account SID and Auth Token together."
      />
      <RhfTextField
        name="twilioNumber"
        label="Calling number"
        helperText="A voice-capable Twilio number, e.g. +14155550100."
      />
    </>
  );
}
