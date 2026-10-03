import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ListSalarySlipsPagedDocument,
  ListUsersDocument,
  SlipStatus,
} from '@exyconn/shell/graphql/generated';
import { PayrollSlipsTable } from './PayrollSlipsTable';

/** Every field the user list selects, so the cache keeps the row whole. */
const user = {
  __typename: 'User' as const,
  id: 'e1',
  name: 'Asha Rao',
  email: 'asha@exyconn.com',
  roles: ['EMPLOYEE'],
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
  employmentStatus: null,
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
};

const slip = {
  __typename: 'SalarySlip' as const,
  id: 's1',
  employeeId: 'e1',
  month: 10,
  year: 2026,
  currency: 'INR',
  gross: 50000,
  deductions: 2500,
  net: 47500,
  status: SlipStatus.Generated,
  issuedDate: '2026-10-25T06:00:00.000Z',
};

interface SlipsVariables {
  input: { page: number; pageSize: number; filters: { field: string; value: string }[] };
}

/**
 * Answers the slips query only when it asks for the FIRST page of October 2026. Pages are
 * zero-based on the server; asking for page 1 skipped every slip and left the table empty.
 */
const slipsMock: MockedResponse = {
  request: {
    query: ListSalarySlipsPagedDocument,
    variables: ({ input }: SlipsVariables) =>
      input.page === 0 &&
      input.filters.some((f) => f.field === 'month' && f.value === '10') &&
      input.filters.some((f) => f.field === 'year' && f.value === '2026'),
  },
  result: {
    data: {
      listSalarySlipsPaged: { __typename: 'SalarySlipPage', totalCount: 1, rows: [slip] },
    },
  },
  maxUsageCount: 5,
};

const usersMock: MockedResponse = {
  request: { query: ListUsersDocument },
  result: { data: { listUsers: [user] } },
  maxUsageCount: 5,
};

describe('PayrollSlipsTable', () => {
  it("asks for the first page of the month's slips and shows them by employee name", () => {
    cy.viewport(1280, 800);
    cy.mount(
      <MockedProvider mocks={[slipsMock, usersMock]}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <PayrollSlipsTable month={10} year={2026} refreshKey="1-0" />
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>,
    );
    cy.contains('Asha Rao').should('be.visible');
    cy.contains('47,500').should('be.visible');
    cy.contains('GENERATED').should('be.visible');
    cy.contains('No slips for this month yet').should('not.exist');
  });
});
