import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { RhfSecretField, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { CallingBotSecret } from '@exyconn/shell/graphql/generated';
import {
  LANGUAGE_OPTIONS,
  MODEL_OPTIONS,
  VOICES,
  type CallingBotConfigRow,
  type CallingBotConfigValues,
} from './calling-bot-config.types';
import { OPENAI_SOURCE, SARVAM_SOURCE } from './calling-bot-key-guide';
import { KeySourceHint } from './CallingBotKeyGuide';
import type { RevealFor } from './useSecretReveal';

interface CallingBotFieldsProps {
  initial: CallingBotConfigRow | null;
  revealFor: RevealFor;
}

/** Who the bot is, what it thinks with and how it sounds. */
export function CallingBotVoiceFields({ initial, revealFor }: Readonly<CallingBotFieldsProps>) {
  const { setValue, getValues } = useFormContext<CallingBotConfigValues>();
  const model = useWatch<CallingBotConfigValues, 'ttsModel'>({ name: 'ttsModel' });
  const voices = useMemo(() => VOICES[model] ?? [], [model]);

  // A voice belongs to one model: switching the model picks that model's first voice.
  useEffect(() => {
    if (voices.length > 0 && !voices.includes(getValues('ttsSpeaker'))) {
      setValue('ttsSpeaker', voices[0], { shouldValidate: true });
    }
  }, [getValues, setValue, voices]);

  return (
    <>
      <RhfTextField name="label" label="Label" />
      <RhfSecretField
        name="sarvamApiKey"
        label="Sarvam AI key"
        stored={initial?.hasSarvamApiKey}
        onReveal={revealFor(CallingBotSecret.SarvamApiKey)}
        helperText={<KeySourceHint source={SARVAM_SOURCE} />}
      />
      <RhfSecretField
        name="openAiApiKey"
        label="OpenAI key"
        stored={initial?.hasOpenAiApiKey}
        onReveal={revealFor(CallingBotSecret.OpenaiApiKey)}
        helperText={<KeySourceHint source={OPENAI_SOURCE} />}
      />
      <RhfTextField
        name="openAiModel"
        label="OpenAI model"
        helperText="A fast chat model such as gpt-4o-mini: the reply has to start within a second."
      />
      <RhfTextField
        name="systemPrompt"
        label="Who the bot is"
        multiline
        minRows={4}
        helperText="The bot's role, what it knows and what it should get from the caller."
      />
      <RhfTextField name="greeting" label="Greeting" helperText="The first thing the bot says." />
      <RhfSelect name="languageCode" label="Language" options={LANGUAGE_OPTIONS} />
      <RhfSelect name="ttsModel" label="Voice model" options={MODEL_OPTIONS} />
      <RhfSelect
        name="ttsSpeaker"
        label="Voice"
        options={voices.map((voice) => ({ value: voice, label: voice }))}
      />
      <RhfTextField
        name="maxCallSeconds"
        label="Longest call (seconds)"
        type="number"
        helperText="A call is hung up after this, so a demo cannot run up the bill."
      />
    </>
  );
}
