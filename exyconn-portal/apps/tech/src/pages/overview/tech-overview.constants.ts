import { ProblemStatus, StatusState } from '@exyconn/shell/graphql/generated';

/** How far back the email and uptime sparklines look. */
export const OVERVIEW_DAYS = 7;

/** How many services the overview lists before sending you to the monitors page. */
export const RECENT_SERVICES = 8;

/** A report in one of these states is still somebody's problem. */
export const OPEN_PROBLEM_STATUSES: readonly ProblemStatus[] = [
  ProblemStatus.New,
  ProblemStatus.Triaged,
  ProblemStatus.InProgress,
];

/** Anything but this is worth showing at the top of the service list. */
export const HEALTHY_STATE = StatusState.Operational;
