import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTestCallingBotKeyMutation, type CallingBotKey } from '@exyconn/shell/graphql/generated';
import type { CallingBotConfigValues } from './calling-bot-config.types';

/** Runs one account's Test button; resolves to what worked, rejects saying what did not. */
export type TestFor = (key: CallingBotKey) => () => Promise<string>;

/**
 * The Test buttons' check: what is typed in the form, with the edited config's saved keys
 * standing in for any left blank, so a key can be tested before or after it is saved.
 */
export function useKeyTest(configId: string | undefined): TestFor {
  const { getValues } = useFormContext<CallingBotConfigValues>();
  const [testKey] = useTestCallingBotKeyMutation();
  return useCallback(
    (key) => async () => {
      const values = getValues();
      const { data } = await testKey({
        variables: {
          input: {
            configId,
            key,
            sarvamApiKey: values.sarvamApiKey,
            languageCode: values.languageCode,
            ttsModel: values.ttsModel,
            ttsSpeaker: values.ttsSpeaker,
            openAiApiKey: values.openAiApiKey,
            openAiModel: values.openAiModel,
            vobizAuthId: values.vobizAuthId,
            vobizAuthToken: values.vobizAuthToken,
            twilioAccountSid: values.twilioAccountSid,
            twilioAuthToken: values.twilioAuthToken,
          },
        },
      });
      return data?.testCallingBotKey ?? '';
    },
    [configId, getValues, testKey],
  );
}
