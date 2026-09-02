import type { ListGoalsPagedQuery, GoalStatus } from '@exyconn/shell/graphql/generated';

export type GoalRow = ListGoalsPagedQuery['listGoalsPaged']['rows'][number];

export interface GoalFormValues {
  employeeId: string;
  title: string;
  description: string;
  kpi: string;
  weightage: number | string;
  startDate: string;
  endDate: string;
  progress: number | string;
  status: GoalStatus;
  managerComment: string;
}
