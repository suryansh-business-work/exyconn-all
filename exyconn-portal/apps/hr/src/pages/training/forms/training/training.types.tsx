import type { ListTrainingsPagedQuery, TrainingStatus } from '@exyconn/shell/graphql/generated';

export type TrainingRow = ListTrainingsPagedQuery['listTrainingsPaged']['rows'][number];

export interface TrainingFormValues {
  employeeId: string;
  title: string;
  provider: string;
  category: string;
  assignedOn: string;
  dueOn: string;
  completedOn: string;
  status: TrainingStatus;
  certificateUrl: string;
}
