import type { NotificationAudience, NotificationKind } from '@exyconn/shell/graphql/generated';

export interface SendNotificationFormValues {
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  audience: NotificationAudience;
  department: string;
  employeeIds: string[];
}
