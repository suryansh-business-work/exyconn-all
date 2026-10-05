import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateWebsiteChatFaqMutation,
  useUpdateWebsiteChatFaqMutation,
} from '@exyconn/shell/graphql/generated';
import {
  chatFaqSchema,
  toChatFaqValues,
  type ChatFaqFormInput,
  type ChatFaqFormValues,
  type ChatFaqRow,
} from './chat-faq.types';

interface ChatFaqFormProps {
  initial: ChatFaqRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update one question in the widget's FAQs tab. */
export function ChatFaqForm({ initial, onDone, onCancel }: Readonly<ChatFaqFormProps>) {
  const [createFaq] = useCreateWebsiteChatFaqMutation();
  const [updateFaq] = useUpdateWebsiteChatFaqMutation();
  const methods = useForm<ChatFaqFormInput, unknown, ChatFaqFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(chatFaqSchema),
    defaultValues: toChatFaqValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'FAQ',
    initial,
    create: (values: ChatFaqFormValues) => createFaq({ variables: { input: values } }),
    update: (row, values) => updateFaq({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="question" label="Question" helperText="Up to 300 characters." />
      <RhfTextField
        name="answer"
        label="Answer"
        multiline
        minRows={4}
        helperText="Shown when a visitor opens the question. Up to 2000 characters."
      />
      <RhfTextField
        name="sortOrder"
        label="Order"
        type="number"
        helperText="Lower numbers appear first in the widget."
      />
      <RhfSwitch name="isActive" label="Show in the chat widget" />
    </EntityForm>
  );
}
