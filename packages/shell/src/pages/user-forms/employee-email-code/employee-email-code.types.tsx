import type { EmployeeEmailKind } from '@/graphql/generated';

/** What HR types: the six-digit code the employee read out from the email. */
export interface EmployeeEmailCodeFormValues {
  code: string;
}

/** Which of an employee's addresses is being proven, and where the code went. */
export interface EmployeeEmailTarget {
  employeeId: string;
  kind: EmployeeEmailKind;
  /** The address the code was sent to, shown so HR can tell the two apart. */
  address: string;
}
