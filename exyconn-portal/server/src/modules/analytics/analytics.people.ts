import { UserModel } from '../admin/user.model';
import { ONLINE_WINDOW_MS } from '../admin/presence';
import { ROLES } from '../../constants/roles';
import { countBy, dayOf, fillTrend } from './analytics.metrics';

const EMPLOYEES = { roles: ROLES.EMPLOYEE };

/** Every account in the company: how many can sign in, who is online, who holds which role. */
export async function userAnalytics(since: Date, timeZone: string, days: readonly string[]) {
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [total, active, blocked, onlineNow, joined, byRole, joinedRows] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isActive: true }),
    UserModel.countDocuments({ isBlocked: true }),
    UserModel.countDocuments({ lastActiveAt: { $gte: onlineSince } }),
    UserModel.countDocuments({ createdAt: { $gte: since } }),
    countBy(UserModel, {}, 'roles', true),
    UserModel.aggregate<{ _id: string; value: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: dayOf('createdAt', timeZone), value: { $sum: 1 } } },
    ]),
  ]);
  return {
    total,
    active,
    inactive: total - active,
    blocked,
    onlineNow,
    joined,
    byRole,
    joinedPerDay: fillTrend(days, joinedRows),
  };
}

/** The people holding the EMPLOYEE role, broken down the ways HR files them. */
export async function employeeAnalytics() {
  const [total, byStatus, byDepartment, byWorkLocation, byCountry] = await Promise.all([
    UserModel.countDocuments(EMPLOYEES),
    countBy(UserModel, EMPLOYEES, 'employmentStatus'),
    countBy(UserModel, EMPLOYEES, 'department'),
    countBy(UserModel, EMPLOYEES, 'workLocation'),
    countBy(UserModel, EMPLOYEES, 'country'),
  ]);
  return { total, byStatus, byDepartment, byWorkLocation, byCountry };
}
