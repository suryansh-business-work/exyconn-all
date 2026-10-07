import { describe, expect, it } from 'vitest';
import {
  ListAttendanceDocument,
  ListEmployeeRequestsPagedDocument,
  ListHolidaysDocument,
  ListLeaveRequestsDocument,
  ListUsersDocument,
} from '@exyconn/shell/graphql/generated';
import {
  attendanceReport,
  employeesReport,
  headcountReport,
  holidaysReport,
  leaveReport,
  nameLookup,
  requestsReport,
} from '../../../../src/pages/reports/reports.people';
import type { AnyReport } from '../../../../src/pages/reports/reports.types';
import { fakeClient, pageOf } from './fake-client';

const user = (id: string, name: string, department: string | null, isActive = true) => ({
  id,
  name,
  email: `${id}@example.com`,
  department,
  designation: 'Engineer',
  joinDate: '2024-01-15',
  employmentStatus: 'ACTIVE',
  isActive,
  roles: ['EMPLOYEE', 'HR'],
});

const USERS = [
  user('u1', 'Asha', 'Platform'),
  user('u2', 'Bala', 'Platform', false),
  user('u3', 'Chen', ''),
  user('u4', 'Dev', 'Sales'),
  user('u5', 'Ema', 'Platform'),
];

const { client } = fakeClient([
  [ListUsersDocument, () => ({ listUsers: USERS })],
  [
    ListAttendanceDocument,
    () => ({
      listAttendance: [{ employeeId: 'u1', date: '2026-03-02', status: 'PRESENT', note: null }],
    }),
  ],
  [
    ListLeaveRequestsDocument,
    () => ({
      listLeaveRequests: [
        {
          employeeId: 'gone',
          type: 'SICK',
          fromDate: '2026-03-02',
          toDate: '2026-03-03',
          status: 'APPROVED',
          reason: 'Flu',
        },
      ],
    }),
  ],
  [
    ListHolidaysDocument,
    () => ({
      listHolidays: [{ name: 'Holi', date: '2026-03-04', type: 'PUBLIC', description: '' }],
    }),
  ],
  [
    ListEmployeeRequestsPagedDocument,
    (options) => ({
      listEmployeeRequestsPaged: pageOf(
        [
          {
            employeeId: 'u4',
            type: 'WFH',
            subject: 'Friday',
            status: 'PENDING',
            createdAt: '2026-03-01',
            decisionNote: null,
          },
        ],
        options,
      ),
    }),
  ],
]);

/** A report's rows as its CSV would write them: header -> value. */
async function csvRows(report: AnyReport) {
  const rows = await report.load(client);
  return rows.map((row) =>
    Object.fromEntries(report.columns.map((column) => [column.header, column.value(row)])),
  );
}

describe('people reports', () => {
  it('maps every user id to a display name', async () => {
    const names = await nameLookup(client);

    expect(names.get('u1')).toBe('Asha');
    expect(names.size).toBe(5);
  });

  it('lists every employee with their roles and whether they are active', async () => {
    const rows = await csvRows(employeesReport);

    expect(employeesReport).toMatchObject({ key: 'employees', label: 'Employees' });
    expect(rows[0]).toEqual({
      Name: 'Asha',
      Email: 'u1@example.com',
      Department: 'Platform',
      Designation: 'Engineer',
      Joined: '2024-01-15',
      'Employment status': 'ACTIVE',
      Active: 'Yes',
      Roles: 'EMPLOYEE HR',
    });
    expect(rows[1].Active).toBe('No');
  });

  it('counts heads per department, largest first, with no department as Unassigned', async () => {
    expect(await csvRows(headcountReport)).toEqual([
      { Department: 'Platform', Employees: 3, Active: 2 },
      { Department: 'Unassigned', Employees: 1, Active: 1 },
      { Department: 'Sales', Employees: 1, Active: 1 },
    ]);
  });

  it('names the employee on each attendance record', async () => {
    expect(await csvRows(attendanceReport)).toEqual([
      { Employee: 'Asha', Date: '2026-03-02', Status: 'PRESENT', Note: null },
    ]);
  });

  it('keeps the id of a leave request whose employee is no longer listed', async () => {
    expect(await csvRows(leaveReport)).toEqual([
      {
        Employee: 'gone',
        Type: 'SICK',
        From: '2026-03-02',
        To: '2026-03-03',
        Status: 'APPROVED',
        Reason: 'Flu',
      },
    ]);
  });

  it('lists the holiday calendar as it is stored', async () => {
    expect(await csvRows(holidaysReport)).toEqual([
      { Holiday: 'Holi', Date: '2026-03-04', Type: 'PUBLIC', Description: '' },
    ]);
  });

  it('pages through every employee request and names who raised it', async () => {
    expect(await csvRows(requestsReport)).toEqual([
      {
        Employee: 'Dev',
        Type: 'WFH',
        Subject: 'Friday',
        Status: 'PENDING',
        Raised: '2026-03-01',
        'Decision note': null,
      },
    ]);
  });
});
