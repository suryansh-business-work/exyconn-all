import { useWatch } from 'react-hook-form';
import { Typography } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { CallingBotPhoneProvider } from '@exyconn/shell/graphql/generated';
import { useT } from '@exyconn/i18n';
import {
  BOOL_OPTIONS,
  PHONE_PROVIDER_OPTIONS,
  type CallingBotConfigValues,
} from './calling-bot-config.types';
import { TwilioFields, VobizFields, type ProviderFieldsProps } from './calling-bot-provider.fields';
import { useKeyTest } from './useKeyTest';

/** Which account rings real phones, and its keys. With none, the demo offers browser calls only. */
export function CallingBotPhoneFields({
  initial,
  revealFor,
}: Readonly<Omit<ProviderFieldsProps, 'testFor'>>) {
  const t = useT();
  const testFor = useKeyTest(initial?.id);
  const props = { initial, revealFor, testFor };
  const provider = useWatch<CallingBotConfigValues, 'phoneProvider'>({ name: 'phoneProvider' });
  return (
    <>
      <Typography variant="subtitle2" component="h3" sx={{ mt: 1 }}>
        {t('Phone calls — optional')}
      </Typography>
      <RhfSelect
        name="phoneProvider"
        label="Place phone calls through"
        options={PHONE_PROVIDER_OPTIONS}
        helperText="Browser calls need only Sarvam AI and OpenAI. Choose an account to also ring real phones."
      />
      {provider === CallingBotPhoneProvider.Vobiz && <VobizFields {...props} />}
      {provider === CallingBotPhoneProvider.Twilio && <TwilioFields {...props} />}
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </>
  );
}
