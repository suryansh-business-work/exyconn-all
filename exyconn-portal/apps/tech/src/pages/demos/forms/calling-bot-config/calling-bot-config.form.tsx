import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CallingBotPhoneProvider,
  useCreateCallingBotConfigMutation,
  useUpdateCallingBotConfigMutation,
} from '@exyconn/shell/graphql/generated';
import {
  makeSchema,
  type CallingBotConfigRow,
  type CallingBotConfigSchema,
  type CallingBotConfigValues,
} from './calling-bot-config.types';
import { CallingBotVoiceFields } from './calling-bot-voice.fields';
import { CallingBotPhoneFields } from './calling-bot-phone.fields';
import { CallingBotKeyGuide } from './CallingBotKeyGuide';
import { useSecretReveal } from './useSecretReveal';

/** Where a new config starts: a fast model, Hindi, and Sarvam's free-tier voice. */
const NEW_CONFIG = {
  openAiModel: 'gpt-4o-mini',
  languageCode: 'hi-IN',
  ttsModel: 'bulbul:v2',
  ttsSpeaker: 'anushka',
  maxCallSeconds: 300,
};

const toInput = ({ isActive, ...values }: CallingBotConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});

const toInitial = (row: CallingBotConfigRow | null): z.input<CallingBotConfigSchema> => ({
  label: row?.label ?? '',
  // Never prefilled: a saved key is fetched only by its eye button, and blank keeps it.
  sarvamApiKey: '',
  openAiApiKey: '',
  openAiModel: row?.openAiModel ?? NEW_CONFIG.openAiModel,
  systemPrompt: row?.systemPrompt ?? '',
  greeting: row?.greeting ?? '',
  languageCode: row?.languageCode ?? NEW_CONFIG.languageCode,
  ttsModel: row?.ttsModel ?? NEW_CONFIG.ttsModel,
  ttsSpeaker: row?.ttsSpeaker ?? NEW_CONFIG.ttsSpeaker,
  maxCallSeconds: row?.maxCallSeconds ?? NEW_CONFIG.maxCallSeconds,
  phoneProvider: row?.phoneProvider ?? CallingBotPhoneProvider.None,
  vobizAuthId: row?.vobizAuthId ?? '',
  vobizAuthToken: '',
  vobizNumber: row?.vobizNumber ?? '',
  twilioAccountSid: row?.twilioAccountSid ?? '',
  twilioAuthToken: '',
  twilioNumber: row?.twilioNumber ?? '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface CallingBotConfigFormProps {
  initial: CallingBotConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the calling bot's settings. */
export function CallingBotConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<CallingBotConfigFormProps>) {
  const [createConfig] = useCreateCallingBotConfigMutation();
  const [updateConfig] = useUpdateCallingBotConfigMutation();
  const revealFor = useSecretReveal(initial?.id);
  const methods = useForm<z.input<CallingBotConfigSchema>, unknown, CallingBotConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Calling bot config',
    initial,
    create: (values: CallingBotConfigValues) =>
      createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <CallingBotKeyGuide isEdit={isEdit} />
      <CallingBotVoiceFields initial={initial} revealFor={revealFor} />
      <CallingBotPhoneFields initial={initial} revealFor={revealFor} />
    </EntityForm>
  );
}
