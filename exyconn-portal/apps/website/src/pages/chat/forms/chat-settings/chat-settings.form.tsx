import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Divider } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  WebsiteChatSettingsDocument,
  useUpdateWebsiteChatSettingsMutation,
} from '@exyconn/shell/graphql/generated';
import {
  chatSettingsSchema,
  toChatSettingsValues,
  type ChatSettingsFormInput,
  type ChatSettingsFormValues,
  type ChatSettingsRow,
} from './chat-settings.types';
import { ChatAgentsFields } from './chat-agents.fields';
import { ChatBehaviourFields } from './chat-behaviour.fields';
import { ChatHoursFields } from './chat-hours.fields';
import { ChatMessagesFields } from './chat-messages.fields';
import { ChatSlackFields } from './chat-slack.fields';

interface ChatSettingsFormProps {
  initial: ChatSettingsRow;
}

/**
 * React Hook Form + Zod form for Website > Chatbot > Settings. Saving pushes the new
 * settings to every open chat widget straight away (the server announces them).
 */
export function ChatSettingsForm({ initial }: Readonly<ChatSettingsFormProps>) {
  const notify = useNotify();
  const [updateSettings] = useUpdateWebsiteChatSettingsMutation({
    refetchQueries: [WebsiteChatSettingsDocument],
  });
  const methods = useForm<ChatSettingsFormInput, unknown, ChatSettingsFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(chatSettingsSchema),
    defaultValues: toChatSettingsValues(initial),
  });

  const onSubmit = async (values: ChatSettingsFormValues) => {
    try {
      await updateSettings({ variables: { input: values } });
      methods.reset(values);
      notify('Chatbot settings saved', 'success');
    } catch (error) {
      notify(errorMessage(error, 'Save failed'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save settings"
      onCancel={() => methods.reset(toChatSettingsValues(initial))}
    >
      <ChatBehaviourFields />
      <Divider />
      <ChatMessagesFields />
      <Divider />
      <ChatHoursFields savedTimezone={initial.timezone} />
      <Divider />
      <ChatAgentsFields />
      <Divider />
      <ChatSlackFields />
    </EntityForm>
  );
}
