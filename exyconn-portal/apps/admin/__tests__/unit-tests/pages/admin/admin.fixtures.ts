import type { MockLink } from '@apollo/client/testing';
import {
  EmploymentStatus,
  ListUsersPagedDocument,
  ListUsersStatsDocument,
  Role,
} from '@exyconn/shell/graphql/generated';
import type { PagedUserRow } from '../../../../src/pages/admin/users-grid';
import { tableStats } from '../../crud-dashboard.stub';

/** One user as the paged Users grid returns it. */
export const user = (overrides: Partial<PagedUserRow> = {}): PagedUserRow => ({
  __typename: 'User',
  id: 'user-1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  roles: [Role.Admin],
  avatarUrl: null,
  isActive: true,
  isBlocked: false,
  blockReason: null,
  department: null,
  designation: null,
  locationCode: null,
  teamName: null,
  gradeCode: null,
  employmentTypeCode: null,
  shiftCode: null,
  joinDate: null,
  dateOfBirth: null,
  probationEndDate: null,
  employmentStatus: EmploymentStatus.Active,
  address: null,
  brief: null,
  managerId: null,
  managerName: null,
  workingTime: null,
  workingTimeNote: null,
  workLocation: null,
  workLocationNote: null,
  workHoursPerDay: null,
  timezone: null,
  locale: null,
  country: null,
  region: null,
  city: null,
  ...overrides,
});

/** The Users stats aggregation: five users, three active, two admins, two roles in use. */
export const usersStats = (): MockLink.MockedResponse => ({
  request: { query: ListUsersStatsDocument },
  result: {
    data: {
      listUsersStats: tableStats(5, {
        isActive: { true: 3, false: 2 },
        roles: { [Role.Admin]: 2, [Role.Employee]: 4 },
      }),
    },
  },
});

/** One page of the Users grid, whatever page the grid asked for. */
export const usersPage = (rows: PagedUserRow[]): MockLink.MockedResponse => ({
  request: { query: ListUsersPagedDocument, variables: () => true },
  result: {
    data: { listUsersPaged: { __typename: 'UserPage', totalCount: rows.length, rows } },
  },
});
