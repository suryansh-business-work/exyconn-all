import type { ListTeamsPagedQuery } from '@exyconn/shell/graphql/generated';

export type TeamRow = ListTeamsPagedQuery['listTeamsPaged']['rows'][number];

export interface TeamFormValues {
  name: string;
  department: string;
  leadEmployeeId: string;
  description: string;
  active: string;
}
