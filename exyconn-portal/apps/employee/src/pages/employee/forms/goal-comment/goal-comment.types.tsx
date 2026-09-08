import type { TeamGoalsQuery } from '@exyconn/shell/graphql/generated';

export type TeamGoalRow = TeamGoalsQuery['teamGoals'][number];

export interface GoalCommentFormValues {
  comment: string;
}
