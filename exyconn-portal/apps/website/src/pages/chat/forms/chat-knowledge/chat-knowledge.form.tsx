import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  WebsiteChatKnowledgeSource,
  useCreateWebsiteChatKnowledgeMutation,
  useUpdateWebsiteChatKnowledgeMutation,
} from '@exyconn/shell/graphql/generated';
import {
  chatKnowledgeSchema,
  toChatKnowledgeValues,
  type ChatKnowledgeFormValues,
  type ChatKnowledgeRow,
} from './chat-knowledge.types';

interface ChatKnowledgeFormProps {
  initial: ChatKnowledgeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for the Knowledge Bot's "Custom Content window": something the
 * team wants the bot to know that is not on exyconn.com. Anything written here is CUSTOM and
 * no website sync ever touches it.
 */
export function ChatKnowledgeForm({ initial, onDone, onCancel }: Readonly<ChatKnowledgeFormProps>) {
  const t = useT();
  const [createKnowledge] = useCreateWebsiteChatKnowledgeMutation();
  const [updateKnowledge] = useUpdateWebsiteChatKnowledgeMutation();
  const methods = useForm<ChatKnowledgeFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(chatKnowledgeSchema),
    defaultValues: toChatKnowledgeValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Knowledge',
    initial,
    create: (values: ChatKnowledgeFormValues) => createKnowledge({ variables: { input: values } }),
    update: (row, values) => updateKnowledge({ variables: { id: row.id, input: values } }),
    onDone,
  });
  const fromWebsite = initial?.source === WebsiteChatKnowledgeSource.Website;

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      {fromWebsite && (
        <Alert severity="warning">
          {t(
            'This entry was read from exyconn.com. The next website sync replaces it, so edit the page on the site instead, or switch it off here.',
          )}
        </Alert>
      )}
      <RhfTextField
        name="title"
        label="Title"
        helperText="What this is about. Up to 300 characters."
      />
      <RhfTextField
        name="url"
        label="Link (optional)"
        helperText="A page the bot can point visitors to, e.g. https://exyconn.com/pricing."
      />
      <RhfTextField
        name="content"
        label="Content"
        multiline
        minRows={8}
        helperText="Plain facts the Knowledge Bot may answer from. Up to 20000 characters."
      />
      <RhfSwitch name="isActive" label="The bot may use this" />
    </EntityForm>
  );
}
