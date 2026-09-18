import type { FilterQuery } from 'mongoose';
import { AttendanceModel, type AttendanceDocument } from './attendance.model';
import { UserModel } from '../admin/user.model';
import { badRequest } from '../../utils/errors';
import {
  escapeRegex,
  TABLE_QUERY_LIMITS,
  tableQuery,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';
import { dayKeyOf, EMPTY_BRIEF, projectDaysFilter, trackerBriefs } from './attendance.tracker';

/**
 * The register's whitelist. Search is handled here rather than by the table engine, because
 * it has to match the employee's name and email, which live on the user, not the record.
 */
const ATTENDANCE_TABLE: TableConfig = {
  searchFields: [],
  filterFields: ['status', 'employeeId'],
  sortFields: ['date', 'status', 'employeeId', 'createdAt'],
  defaultSort: { field: 'date', dir: 'DESC' },
};

/** Filters the register reads itself, because they are not a plain field comparison. */
export const ATTENDANCE_FILTER = Object.freeze({
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  projectId: 'projectId',
});

/** A filter's value by field name, or null when the grid did not send it. */
function filterValue(input: TableQueryInput, field: string): string | null {
  const value = input.filters?.find((filter) => filter.field === field)?.value?.trim();
  return value || null;
}

/** A `YYYY-MM-DD` filter as the midnight-UTC instant attendance is keyed on. */
function dayFilter(input: TableQueryInput, field: string): Date | null {
  const value = filterValue(input, field);
  if (!value) {
    return null;
  }
  const day = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime())) {
    badRequest(`${field} must be a date (YYYY-MM-DD)`);
  }
  return day;
}

/** Records whose employee's name or email, or whose own note, contains the search text. */
async function searchCondition(search: string): Promise<FilterQuery<AttendanceDocument>> {
  const pattern = { $regex: escapeRegex(search), $options: 'i' };
  const users = await UserModel.find({ $or: [{ name: pattern }, { email: pattern }] })
    .select('_id')
    .lean();
  return { $or: [{ employeeId: { $in: users.map((u) => String(u._id)) } }, { note: pattern }] };
}

/** Search, the date range and the project filter as one Mongo condition. */
async function baseFilter(input: TableQueryInput): Promise<FilterQuery<AttendanceDocument>> {
  const from = dayFilter(input, ATTENDANCE_FILTER.dateFrom);
  const to = dayFilter(input, ATTENDANCE_FILTER.dateTo);
  if (from && to && from > to) {
    badRequest('The start date must be on or before the end date');
  }
  const and: FilterQuery<AttendanceDocument>[] = [];
  if (from || to) {
    and.push({ date: { ...(from && { $gte: from }), ...(to && { $lte: to }) } });
  }
  const search = input.search?.trim();
  if (search && search.length > TABLE_QUERY_LIMITS.maxSearchLength) {
    badRequest(`Search is limited to ${TABLE_QUERY_LIMITS.maxSearchLength} characters`);
  }
  if (search) {
    and.push(await searchCondition(search));
  }
  const projectId = filterValue(input, ATTENDANCE_FILTER.projectId);
  if (projectId) {
    and.push(await projectDaysFilter(projectId, from, to));
  }
  return and.length > 0 ? { $and: and } : {};
}

/** Name, email and role on the job for every employee on a page, in one query. */
async function employeesOf(employeeIds: string[]) {
  const users = await UserModel.find({ _id: { $in: employeeIds } })
    .select('name email designation department')
    .lean();
  return new Map(users.map((user) => [String(user._id), user]));
}

/**
 * One page of the HR attendance register: each record with the employee it belongs to and a
 * brief of what the tracker recorded that day — time, sessions and the projects it went on.
 */
export async function attendancePage(input: TableQueryInput) {
  const page = await tableQuery(AttendanceModel, input, ATTENDANCE_TABLE, await baseFilter(input));
  const rows = page.rows as Array<AttendanceDocument & { _id: unknown }>;
  const [employees, briefs] = await Promise.all([
    employeesOf([...new Set(rows.map((row) => row.employeeId))]),
    trackerBriefs(rows),
  ]);
  return {
    totalCount: page.totalCount,
    rows: rows.map((row) => {
      const employee = employees.get(row.employeeId);
      return {
        ...row,
        id: String(row._id),
        employeeName: employee?.name ?? row.employeeId,
        employeeEmail: employee?.email ?? '',
        designation: employee?.designation ?? null,
        department: employee?.department ?? null,
        tracker: briefs.get(dayKeyOf(row.employeeId, row.date)) ?? EMPTY_BRIEF,
      };
    }),
  };
}
