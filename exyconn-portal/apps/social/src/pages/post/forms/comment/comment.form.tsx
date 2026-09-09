import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SocialCommentsDocument,
  SocialPostDocument,
  useCreateSocialCommentMutation,
} from '@exyconn/shell/graphql/generated';
import { MAX_COMMENT_LENGTH, commentSchema, type CommentFormValues } from './comment.schema';

const EMPTY: CommentFormValues = { body: '' };

interface CommentFormProps {
  postId: string;
}

/**
 * The reply box under a post. React Hook Form with a Zod schema, like every other form
 * in the portal.
 *
 * Both the thread and the post itself are refetched: the comment joins the thread, and
 * the post's comment count on the card above it has to move at the same moment or the
 * page contradicts itself.
 */
export function CommentForm({ postId }: Readonly<CommentFormProps>) {
  const notify = useNotify();
  const [createComment] = useCreateSocialCommentMutation({
    refetchQueries: [
      { query: SocialCommentsDocument, variables: { postId } },
      { query: SocialPostDocument, variables: { id: postId } },
    ],
  });

  const methods = useForm<CommentFormValues, unknown, CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = async (values: CommentFormValues) => {
    try {
      await createComment({ variables: { postId, body: values.body } });
      methods.reset(EMPTY);
    } catch (error) {
      notify(errorMessage(error, 'Could not post that comment'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={() => methods.reset(EMPTY)}
      submitLabel="Comment"
    >
      <RhfTextField
        name="body"
        label="Add a comment"
        multiline
        minRows={2}
        helperText={`Up to ${MAX_COMMENT_LENGTH} characters.`}
      />
    </EntityForm>
  );
}
