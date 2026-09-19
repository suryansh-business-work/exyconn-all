import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { MyHolidaysDocument, MyLeaveRequestsDocument } from '@exyconn/shell/graphql/generated';
import { AttendanceCalendar } from './AttendanceCalendar';

const now = new Date();
const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), d);
const utcDay = (d: number) =>
  new Date(Date.UTC(now.getFullYear(), now.getMonth(), d)).toISOString();

const MOCKS = [
  {
    request: { query: MyLeaveRequestsDocument },
    result: {
      data: {
        myLeaveRequests: [
          {
            __typename: 'LeaveRequest',
            id: 'l1',
            employeeId: 'e1',
            type: 'CL',
            fromDate: day(8).toISOString(),
            toDate: day(8).toISOString(),
            reason: 'Family',
            status: 'PENDING',
          },
        ],
      },
    },
  },
  {
    request: { query: MyHolidaysDocument },
    result: {
      data: {
        myHolidays: [
          {
            __typename: 'Holiday',
            id: 'h1',
            name: 'Founders Day',
            date: day(12).toISOString(),
            type: 'PUBLIC',
            description: null,
            country: '',
            excludedCountries: [],
            cities: [],
          },
        ],
      },
    },
  },
];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={MOCKS}>
      <ThemeProvider theme={theme}>
        <AttendanceCalendar
          attendance={[{ date: utcDay(5), status: 'PRESENT' }]}
          attendanceLoading={false}
        />
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AttendanceCalendar', () => {
  it('names each day by what happened on it', () => {
    mount();
    cy.get('[aria-label*="Attendance marked"]').should('have.length', 1);
    cy.get('[aria-label*="Leave requested"]').should('have.length', 1);
    cy.get('[aria-label*="Public holiday"]').should('contain.text', '12');
  });

  it('explains every colour', () => {
    mount();
    cy.contains('What the colours mean').should('be.visible');
    for (const label of [
      'Attendance marked',
      'Leave requested',
      'Leave rejected',
      'Public holiday',
    ]) {
      cy.contains('li', label).should('be.visible');
    }
  });

  it('moves between months', () => {
    mount();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    cy.get('button[aria-label="Next month"]').click();
    cy.contains(next.toLocaleString('en-US', { month: 'long', year: 'numeric' })).should(
      'be.visible',
    );
  });
});
