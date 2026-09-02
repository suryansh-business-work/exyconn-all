import type {
  ListEmployeeRequestsPagedQuery,
  RequestStatus,
  RequestType,
} from '@exyconn/shell/graphql/generated';

export type EmployeeRequestRow =
  ListEmployeeRequestsPagedQuery['listEmployeeRequestsPaged']['rows'][number];

export interface EmployeeRequestFormValues {
  employeeId: string;
  type: RequestType;
  subject: string;
  details: string;
  status: RequestStatus;
  decisionNote: string;
}
