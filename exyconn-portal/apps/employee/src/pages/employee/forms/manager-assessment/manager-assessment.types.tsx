import type { TeamPerformanceReviewsQuery } from '@exyconn/shell/graphql/generated';

export type TeamReviewRow = TeamPerformanceReviewsQuery['teamPerformanceReviews'][number];

export interface ManagerAssessmentFormValues {
  managerAssessment: string;
  /** '' when the manager leaves the score unset; the number input's empty state. */
  score: '' | number;
}
