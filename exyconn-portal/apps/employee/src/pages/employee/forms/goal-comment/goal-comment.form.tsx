import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCommentOnTeamGoalMutation } from '@exyconn/shell/graphql/generated';
import type { GoalCommentFormValues, TeamGoalRow } from './goal-comment.types';

const MAX_LENGTH = 1000;

const schema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Comment is required')
    .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
});

interface GoalCommentFormProps {
  goal: TeamGoalRow;
  onCancel: () => void;
  onDone: () => void;
}

/** React Hook Form + Zod form for the manager's comment on a direct report's goal. */
export function GoalCommentForm({ goal, onCancel, onDone }: Readonly<GoalCommentFormProps>) {
  const notify = useNotify();
  const [comment] = useCommentOnTeamGoalMutation();
  const methods = useForm<GoalCommentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comment: goal.managerComment ?? '' },
  });

  const onSubmit = async (values: GoalCommentFormValues) => {
    try {
      await comment({ variables: { id: goal.id, comment: values.comment } });
      notify('Comment saved');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the comment', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Save comment"
    >
      <RhfTextField
        name="comment"
        label="Your comment"
        multiline
        minRows={4}
        helperText="The employee sees this next to the goal."
      />
    </EntityForm>
  );
}
