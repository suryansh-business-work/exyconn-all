import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { AssetModel } from '../../src/modules/assets/asset.model';
import { LicenceModel } from '../../src/modules/assets/licence.model';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { itsmResolvers } from '../../src/modules/itsm';
import { itCostSummary, lastMonths } from '../../src/modules/itsm/cost';
import {
  ItAccessRequestModel,
  ItCloudResourceModel,
  ItIncidentModel,
  ItPurchaseRequestModel,
} from '../../src/modules/itsm/models';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const q = itsmResolvers.Query as unknown as Record<string, Resolver>;

const DAY = 86_400_000;
const itCtx = {
  user: { id: 'it-1', email: 'it@exyconn.com', roles: [ROLES.IT] },
} as unknown as GraphQLContext;

const inDays = (days: number) => new Date(Date.now() + days * DAY);

async function person(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    department: 'Engineering',
  });
  return String(user._id);
}

const asset = (tag: string, extra: Record<string, unknown> = {}) =>
  AssetModel.create({ assetTag: tag, name: tag, category: 'LAPTOP', ...extra });

describe('IT read models', () => {
  useTestOrganization();

  it('counts what the dashboard shows', async () => {
    await SupportTicketModel.create([
      {
        employeeId: new Types.ObjectId().toString(),
        subject: 'a',
        description: 'd',
        category: 'IT',
        dueAt: inDays(-1),
      },
      {
        employeeId: new Types.ObjectId().toString(),
        subject: 'b',
        description: 'd',
        category: 'HR',
      },
    ]);
    await asset('L-1', { status: 'ASSIGNED', warrantyExpiry: inDays(10) });
    await asset('L-2', { status: 'IN_REPAIR' });
    await ItIncidentModel.create({
      title: 'Down',
      description: 'd',
      category: 'OUTAGE',
      startedAt: new Date(),
    });
    await ItCloudResourceModel.create({
      name: 'exyconn.com',
      kind: 'SSL_CERTIFICATE',
      expiresAt: inDays(5),
    });

    const dashboard = (await q.itDashboard(null, {}, itCtx)) as Record<string, unknown>;

    expect(dashboard).toMatchObject({
      openTickets: 1,
      overdueTickets: 1,
      unassignedTickets: 1,
      assetsTotal: 2,
      assetsAssigned: 1,
      assetsInRepair: 1,
      warrantiesEnding: 1,
      certificatesExpiring: 1,
      activeIncidents: 1,
      activeOutages: 1,
    });
  });

  it("gathers one employee's devices, seats and access", async () => {
    const asha = await person('Asha Rao');
    await asset('L-9', { status: 'ASSIGNED', assignedToId: asha, assignedToName: 'Asha Rao' });
    await LicenceModel.create({
      name: 'Figma',
      vendor: 'Figma',
      seatsTotal: 5,
      assigneeIds: [asha],
      cost: 100,
      renewalDate: inDays(90),
    });
    await ItAccessRequestModel.create([
      {
        employeeId: asha,
        application: 'Slack',
        kind: 'GRANT',
        reason: 'r',
        status: 'FULFILLED',
        fulfilledAt: new Date(),
      },
      { employeeId: asha, application: 'Jira', kind: 'GRANT', reason: 'r', status: 'PENDING' },
    ]);

    const profile = (await q.itEmployeeProfile(null, { employeeId: asha }, itCtx)) as {
      department: string;
      assets: Array<{ assetTag: string }>;
      licences: Array<{ name: string }>;
      access: Array<{ application: string }>;
      openRequests: Array<{ application: string }>;
    };

    expect(profile.department).toBe('Engineering');
    expect(profile.assets.map((row) => row.assetTag)).toEqual(['L-9']);
    expect(profile.licences.map((row) => row.name)).toEqual(['Figma']);
    expect(profile.access.map((row) => row.application)).toEqual(['Slack']);
    expect(profile.openRequests.map((row) => row.application)).toEqual(['Jira']);
  });

  it('normalises running costs to a month and never counts hardware twice', async () => {
    await LicenceModel.create({
      name: 'Suite',
      vendor: 'Acme',
      seatsTotal: 1,
      cost: 1200,
      billingCycle: 'YEARLY',
      renewalDate: inDays(30),
    });
    await ItCloudResourceModel.create({
      name: 'db',
      kind: 'DATABASE',
      provider: 'AWS',
      monthlyCost: 50,
    });
    await asset('L-3', { purchaseDate: new Date(), purchaseCost: 900 });
    await ItPurchaseRequestModel.create([
      {
        title: 'Laptop',
        kind: 'HARDWARE',
        estimatedCost: 900,
        justification: 'j',
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
      {
        title: 'Pentest',
        kind: 'SERVICE',
        estimatedCost: 5000,
        justification: 'j',
        status: 'RECEIVED',
        receivedAt: new Date(),
        quotes: [
          { vendor: 'A', amount: 4000 },
          { vendor: 'B', amount: 4500 },
        ],
      },
    ]);

    const cost = await itCostSummary();

    expect(cost.saasMonthly).toBe(100);
    expect(cost.cloudMonthly).toBe(50);
    expect(cost.annualRunRate).toBe(1800);
    expect(cost.hardwareThisYear).toBe(900);
    expect(cost.procurementThisYear).toBe(4000);
    expect(cost.byVendor.map((row) => row.label)).toEqual(['Acme', 'AWS']);
  });

  it('lists the last N months oldest first, ending this month', () => {
    const months = lastMonths(3, new Date('2026-02-15T00:00:00.000Z'));

    expect(months).toEqual(['2025-12', '2026-01', '2026-02']);
  });

  it('reports tickets, SLA and incident resolution', async () => {
    const created = new Date(Date.now() - 10 * 3_600_000);
    await SupportTicketModel.create([
      {
        employeeId: new Types.ObjectId().toString(),
        subject: 'met',
        description: 'd',
        category: 'IT',
        status: 'RESOLVED',
        dueAt: new Date(created.getTime() + 8 * 3_600_000),
        resolvedAt: new Date(created.getTime() + 4 * 3_600_000),
      },
      {
        employeeId: new Types.ObjectId().toString(),
        subject: 'late',
        description: 'd',
        category: 'IT',
        status: 'RESOLVED',
        dueAt: new Date(created.getTime() + 2 * 3_600_000),
        resolvedAt: new Date(created.getTime() + 8 * 3_600_000),
      },
    ]);
    // Mongoose treats createdAt as immutable, so the back-dating goes through the driver.
    await SupportTicketModel.collection.updateMany({}, { $set: { createdAt: created } });

    const report = (await q.itReport(null, { months: 3 }, itCtx)) as {
      slaMetPercent: number;
      avgResolutionHours: number;
      ticketTrend: Array<{ opened: number }>;
    };

    expect(report.slaMetPercent).toBe(50);
    expect(report.avgResolutionHours).toBe(6);
    expect(report.ticketTrend).toHaveLength(3);
    // Summed, not read off the last month: ten hours ago can be last month on the 1st.
    expect(report.ticketTrend.reduce((sum, point) => sum + point.opened, 0)).toBe(2);
  });

  it('refuses a report span outside 1–24 months', async () => {
    await expect(q.itReport(null, { months: 30 }, itCtx)).rejects.toThrow('1 to 24 months');
  });
});
