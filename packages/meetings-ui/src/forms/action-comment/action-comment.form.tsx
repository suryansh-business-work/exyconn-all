import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMaAddActionCommentMutation } from '@exyconn/shell/graphql/generated';
import type { ActionCommentValues, CommentedActionItem } from './action-comment.types';

const MAX_COMMENT = 2000;

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Write a comment first')
    .max(MAX_COMMENT, 'Keep the comment under 2,000 characters'),
});

interface ActionCommentFormProps {
  actionId: string;
  /** Hands back the item with the new comment on it. */
  onDone: (item: CommentedActionItem) => void;
}

/** Adds a comment to an action item's thread. */
export function ActionCommentForm({ actionId, onDone }: Readonly<ActionCommentFormProps>) {
  const notify = useNotify();
  const [addComment] = useMaAddActionCommentMutation();
  const methods = useForm<ActionCommentValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { text: '' },
  });

  const onSubmit = async (values: ActionCommentValues) => {
    try {
      const result = await addComment({ variables: { id: actionId, text: values.text } });
      const item = result.data?.maAddActionComment;
      if (item) {
        methods.reset({ text: '' });
        notify('Comment added', 'success');
        onDone(item);
      }
    } catch (error) {
      notify(errorMessage(error, 'The comment could not be added.'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={() => methods.reset({ text: '' })}
      submitLabel="Add comment"
    >
      <RhfTextField
        name="text"
        label="Comment"
        multiline
        minRows={2}
        helperText="An update or question on this action item, up to 2,000 characters."
      />
    </EntityForm>
  );
}
