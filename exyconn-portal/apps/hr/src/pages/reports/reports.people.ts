import type { ApolloClient } from '@apollo/client';
import {
  ListUsersDocument,
  ListAttendanceDocument,
  ListLeaveRequestsDocument,
  ListHolidaysDocument,
  ListEmployeeRequestsPagedDocument,
  type ListUsersQuery,
  type ListAttendanceQuery,
  type ListLeaveRequestsQuery,
  type ListHolidaysQuery,
  type ListEmployeeRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { defineReport } from './reports.types';
import { fetchAllPages, fetchList } from './fetchAll';

type User = ListUsersQuery['listUsers'][number];

/** id → display name, so every report can show a person instead of an id. */
export async function nameLookup(client: ApolloClient<object>): Promise<Map<string, string>> {
  const users = await fetchList(client, ListUsersDocument, (d: ListUsersQuery) => d.listUsers);
  return new Map(users.map((u) => [u.id, u.name]));
}

export const employeesReport = defineReport<User>({
  key: 'employees',
  label: 'Employees',
  description: 'Every employee with department, role and status',
  columns: [
    { header: 'Name', value: (u) => u.name },
    { header: 'Email', value: (u) => u.email },
    { header: 'Department', value: (u) => u.department },
    { header: 'Designation', value: (u) => u.designation },
    { header: 'Joined', value: (u) => u.joinDate },
    { header: 'Employment status', value: (u) => u.employmentStatus },
    { header: 'Active', value: (u) => (u.isActive ? 'Yes' : 'No') },
    { header: 'Roles', value: (u) => u.roles.join(' ') },
  ],
  load: (client) => fetchList(client, ListUsersDocument, (d: ListUsersQuery) => d.listUsers),
});

type HeadcountRow = { department: string; employees: number; active: number };

export const headcountReport = defineReport<HeadcountRow>({
  key: 'headcount',
  label: 'Headcount by department',
  description: 'Employees and active employees per department',
  columns: [
    { header: 'Department', value: (r) => r.department },
    { header: 'Employees', value: (r) => r.employees },
    { header: 'Active', value: (r) => r.active },
  ],
  load: async (client) => {
    const users = await fetchList(client, ListUsersDocument, (d: ListUsersQuery) => d.listUsers);
    const byDept = new Map<string, HeadcountRow>();
    for (const u of users) {
      const key = u.department || 'Unassigned';
      const row = byDept.get(key) ?? { department: key, employees: 0, active: 0 };
      row.employees += 1;
      if (u.isActive) row.active += 1;
      byDept.set(key, row);
    }
    return [...byDept.values()].sort((a, b) => b.employees - a.employees);
  },
});

type Attendance = ListAttendanceQuery['listAttendance'][number] & { employeeName: string };

export const attendanceReport = defineReport<Attendance>({
  key: 'attendance',
  label: 'Attendance',
  description: 'Every attendance record',
  columns: [
    { header: 'Employee', value: (r) => r.employeeName },
    { header: 'Date', value: (r) => r.date },
    { header: 'Status', value: (r) => r.status },
    { header: 'Note', value: (r) => r.note },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchList(client, ListAttendanceDocument, (d: ListAttendanceQuery) => d.listAttendance),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});

type Leave = ListLeaveRequestsQuery['listLeaveRequests'][number] & { employeeName: string };

export const leaveReport = defineReport<Leave>({
  key: 'leave',
  label: 'Leave',
  description: 'Every leave request and its outcome',
  columns: [
    { header: 'Employee', value: (r) => r.employeeName },
    { header: 'Type', value: (r) => r.type },
    { header: 'From', value: (r) => r.fromDate },
    { header: 'To', value: (r) => r.toDate },
    { header: 'Status', value: (r) => r.status },
    { header: 'Reason', value: (r) => r.reason },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchList(
        client,
        ListLeaveRequestsDocument,
        (d: ListLeaveRequestsQuery) => d.listLeaveRequests,
      ),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});

type Holiday = ListHolidaysQuery['listHolidays'][number];

export const holidaysReport = defineReport<Holiday>({
  key: 'holidays',
  label: 'Holidays',
  description: 'The company holiday calendar',
  columns: [
    { header: 'Holiday', value: (h) => h.name },
    { header: 'Date', value: (h) => h.date },
    { header: 'Type', value: (h) => h.type },
    { header: 'Description', value: (h) => h.description },
  ],
  load: (client) =>
    fetchList(client, ListHolidaysDocument, (d: ListHolidaysQuery) => d.listHolidays),
});

type Request = ListEmployeeRequestsPagedQuery['listEmployeeRequestsPaged']['rows'][number] & {
  employeeName: string;
};

export const requestsReport = defineReport<Request>({
  key: 'requests',
  label: 'Employee requests',
  description: 'WFH, regularisation and other requests with their decision',
  columns: [
    { header: 'Employee', value: (r) => r.employeeName },
    { header: 'Type', value: (r) => r.type },
    { header: 'Subject', value: (r) => r.subject },
    { header: 'Status', value: (r) => r.status },
    { header: 'Raised', value: (r) => r.createdAt },
    { header: 'Decision note', value: (r) => r.decisionNote },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchAllPages(
        client,
        ListEmployeeRequestsPagedDocument,
        (d: ListEmployeeRequestsPagedQuery) => d.listEmployeeRequestsPaged,
      ),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});
