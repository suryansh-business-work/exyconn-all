import type {
  ListPerformanceReviewsPagedQuery,
  ReviewStatus,
} from '@exyconn/shell/graphql/generated';

export type PerformanceReviewRow =
  ListPerformanceReviewsPagedQuery['listPerformanceReviewsPaged']['rows'][number];

export interface PerformanceReviewFormValues {
  employeeId: string;
  cycle: string;
  selfAssessment: string;
  managerAssessment: string;
  competencies: string;
  score: number | string;
  rating: string;
  actionPlan: string;
  status: ReviewStatus;
}
