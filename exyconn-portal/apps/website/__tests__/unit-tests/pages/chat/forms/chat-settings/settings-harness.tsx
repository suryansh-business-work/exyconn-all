import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  toChatSettingsValues,
  type ChatSettingsFormInput,
} from '../../../../../../src/pages/chat/forms/chat-settings';
import { settingsRow } from '../../chat-fixtures';

interface HarnessProps {
  agentIds?: string[];
  /** Receives the form's agents when "Read agents" is pressed. */
  onRead?: (agentIds: unknown) => void;
  children: ReactNode;
}

/**
 * The settings form's React Hook Form context around one group of fields, with buttons to
 * read the chosen agents back and to raise the error the schema would.
 */
export function SettingsHarness({ agentIds = [], onRead, children }: Readonly<HarnessProps>) {
  const methods = useForm<ChatSettingsFormInput>({
    defaultValues: { ...toChatSettingsValues(settingsRow()), agentIds },
  });
  return (
    <FormProvider {...methods}>
      {children}
      <button type="button" onClick={() => onRead?.(methods.getValues('agentIds'))}>
        Read agents
      </button>
      <button
        type="button"
        onClick={() => methods.setError('agentIds', { message: 'Choose at most 50 agents' })}
      >
        Raise agents error
      </button>
    </FormProvider>
  );
}
