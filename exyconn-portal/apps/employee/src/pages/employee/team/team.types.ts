import type {
  MyDirectReportsQuery,
  TeamGoalsQuery,
  TeamLeaveRequestsQuery,
  TeamPerformanceReviewsQuery,
  TeamRequestsQuery,
} from '@exyconn/shell/graphql/generated';

export type DirectReport = MyDirectReportsQuery['myDirectReports'][number];
export type TeamLeaveRow = TeamLeaveRequestsQuery['teamLeaveRequests'][number];
export type TeamRequestRow = TeamRequestsQuery['teamRequests'][number];
export type TeamReviewRow = TeamPerformanceReviewsQuery['teamPerformanceReviews'][number];
export type TeamGoalRow = TeamGoalsQuery['teamGoals'][number];

/** Resolves a direct report's id to their name for the team tables. */
export type NameOf = (employeeId: string) => string;

/** Props every team section shares: who the rows belong to. */
export interface TeamSectionProps {
  nameOf: NameOf;
}
