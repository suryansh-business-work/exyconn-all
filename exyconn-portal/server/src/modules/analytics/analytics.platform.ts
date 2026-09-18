import { OrganizationModel } from '../organizations/organization.model';
import { UserModel } from '../admin/user.model';
import { TrackerAccessModel } from '../tracker/models';
import { ORGANIZATION_FIELD, runAsPlatform } from '../../lib/tenant';
import { ROLES } from '../../constants/roles';
import { countBy, fillTrend, type Metric } from './analytics.metrics';

/** How many months the "organizations created" trend covers. */
const TREND_MONTHS = 12;
/** How many organizations the "largest organizations" chart names. */
const TOP = 10;

/** The last `months` calendar months as `YYYY-MM`, oldest first (UTC: a platform has no house zone). */
function monthKeys(months: number, now = new Date()): string[] {
  return Array.from({ length: months }, (_, index) => {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index)),
    );
    return month.toISOString().slice(0, 7);
  });
}

/** The organizations with the most user accounts, by name. */
async function usersByOrganization(): Promise<Metric[]> {
  const [rows, organizations] = await Promise.all([
    UserModel.aggregate<{ _id: unknown; value: number }>([
      { $group: { _id: `$${ORGANIZATION_FIELD}`, value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: TOP },
    ]),
    OrganizationModel.find().select('name').lean(),
  ]);
  const names = new Map(organizations.map((row) => [String(row._id), row.name]));
  return rows.map((row) => ({
    label: names.get(String(row._id)) ?? 'No organization',
    value: row.value,
  }));
}

/** Organizations created per month over the last year. */
async function organizationsPerMonth() {
  const keys = monthKeys(TREND_MONTHS);
  const rows = await OrganizationModel.aggregate<{ _id: string; value: number }>([
    { $match: { createdAt: { $gte: new Date(`${keys[0]}-01T00:00:00Z`) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        value: { $sum: 1 },
      },
    },
  ]);
  return fillTrend(keys, rows);
}

/**
 * The platform above the companies: how many organizations there are, how big, and where.
 * Everything runs as the platform — this is the one read that spans every company.
 */
export function platformAnalytics() {
  return runAsPlatform(async () => {
    const [
      organizations,
      activeOrganizations,
      users,
      employees,
      trackedUsers,
      organizationsByStatus,
      organizationsByCountry,
      largest,
      perMonth,
    ] = await Promise.all([
      OrganizationModel.countDocuments(),
      OrganizationModel.countDocuments({ status: 'ACTIVE' }),
      UserModel.countDocuments(),
      UserModel.countDocuments({ roles: ROLES.EMPLOYEE }),
      TrackerAccessModel.countDocuments({ isActive: true }),
      countBy(OrganizationModel, {}, 'status'),
      countBy(OrganizationModel, {}, 'country'),
      usersByOrganization(),
      organizationsPerMonth(),
    ]);
    return {
      organizations,
      activeOrganizations,
      users,
      employees,
      trackedUsers,
      organizationsByStatus,
      organizationsByCountry,
      usersByOrganization: largest,
      organizationsPerMonth: perMonth,
    };
  });
}
