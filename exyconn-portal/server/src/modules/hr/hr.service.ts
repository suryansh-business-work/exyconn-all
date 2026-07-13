import { LeaveRequestModel } from './hr.model';
import { AttendanceModel } from './attendance.model';
import { UserModel } from '../admin/user.model';
import { notFound } from '../../utils/errors';

export interface ApplyLeaveInput {
  type: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
}

export interface MarkAttendanceInput {
  date: Date;
  status: string;
  note?: string;
}

/** Normalizes a date to midnight UTC so one day = one attendance record. */
function dayKey(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Builds a cumulative monthly headcount series from each user's start date. */
function headcountSeries(starts: Date[]): Array<{ label: string; count: number }> {
  if (starts.length === 0) return [];
  const months = starts.map((d) => new Date(d.getFullYear(), d.getMonth(), 1).getTime());
  const start = new Date(Math.min(...months));
  const end = new Date();
  const points: Array<{ label: string; count: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const cutoff = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).getTime();
    const count = starts.filter((d) => d.getTime() < cutoff).length;
    const label = cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    points.push({ label, count });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

/** HR self-service, employee views, and dashboard aggregation (singleton). */
class HrService {
  myLeaves(employeeId: string) {
    return LeaveRequestModel.find({ employeeId }).sort({ createdAt: -1 }).lean();
  }

  applyLeave(employeeId: string, input: ApplyLeaveInput) {
    return LeaveRequestModel.create({ ...input, employeeId, status: 'PENDING' }).then((d) =>
      d.toObject(),
    );
  }

  setLeaveStatus(id: string, status: string) {
    return LeaveRequestModel.findByIdAndUpdate(id, { status }, { new: true })
      .lean()
      .then((doc) => doc ?? notFound('LeaveRequest'));
  }

  leavesByEmployee(employeeId: string) {
    return LeaveRequestModel.find({ employeeId }).sort({ createdAt: -1 }).lean();
  }

  myAttendance(employeeId: string) {
    return AttendanceModel.find({ employeeId }).sort({ date: -1 }).lean();
  }

  attendanceByEmployee(employeeId: string) {
    return AttendanceModel.find({ employeeId }).sort({ date: -1 }).lean();
  }

  listAttendance() {
    return AttendanceModel.find().sort({ date: -1 }).lean();
  }

  markAttendance(employeeId: string, input: MarkAttendanceInput) {
    const date = dayKey(input.date);
    return AttendanceModel.findOneAndUpdate(
      { employeeId, date },
      { employeeId, date, status: input.status, note: input.note ?? null },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  }

  async dashboard() {
    const users = await UserModel.find()
      .select({ joinDate: 1, createdAt: 1, employmentStatus: 1 })
      .lean();
    const starts = users.map((u) => new Date(u.joinDate ?? u.createdAt));
    return {
      totalEmployees: users.length,
      activeEmployees: users.filter((u) => u.employmentStatus === 'ACTIVE').length,
      onLeave: users.filter((u) => u.employmentStatus === 'ON_LEAVE').length,
      headcount: headcountSeries(starts),
    };
  }
}

export const hrService = new HrService();
