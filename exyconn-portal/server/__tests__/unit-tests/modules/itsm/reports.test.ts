import { Types } from 'mongoose';
import { AssetModel } from '../../../../src/modules/assets/asset.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { ItIncidentModel } from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, HOUR, inDays, itQuery as q } from './itsm.fixtures';

type Metric = { label: string; value: number };
type Report = {
  months: number;
  ticketsByStatus: Metric[];
  ticketTrend: Array<{ period: string; opened: number; resolved: number }>;
  avgResolutionHours: number;
  slaMetPercent: number;
  breachedOpen: number;
  assetUtilization: Array<{ category: string; total: number; assigned: number }>;
  incidentsBySeverity: Metric[];
  incidentsByMonth: Metric[];
  mttrHours: number;
  spend: { annualRunRate: number };
};

const it1 = ctxFor('it-1', [ROLES.IT]);
const report = (months?: number | null) => q.itReport(null, { months }, it1) as Promise<Report>;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const ticket = (extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: new Types.ObjectId().toString(),
    subject: 's',
    description: 'd',
    category: 'IT',
    ...extra,
  });

describe('IT report', () => {
  useTestOrganization();

  it('covers six months when no span is asked for, and reads empty data as zeros', async () => {
    const result = await report(null);

    expect(result.months).toBe(6);
    expect(result.ticketTrend).toHaveLength(6);
    expect(result.incidentsByMonth).toHaveLength(6);
    expect(result).toMatchObject({
      avgResolutionHours: 0,
      slaMetPercent: 100,
      breachedOpen: 0,
      mttrHours: 0,
      ticketsByStatus: [],
      assetUtilization: [],
      spend: { annualRunRate: 0 },
    });
  });

  it('refuses a span that is not a whole number of months, or under one', async () => {
    expect(await codeOf(report(2.5))).toBe('BAD_USER_INPUT');
    await expect(report(0)).rejects.toThrow('A report covers 1 to 24 months');
  });

  it('counts tickets by status, resolutions, and open ones past their due time', async () => {
    await ticket({ dueAt: inDays(-1) });
    await ticket({ status: 'IN_PROGRESS', dueAt: inDays(1) });
    await ticket({ status: 'CLOSED', dueAt: inDays(-2) });
    await ticket({ category: 'HR', dueAt: inDays(-1) });
    await ticket({ status: 'RESOLVED', dueAt: inDays(1), resolvedAt: new Date() });

    const result = await report(1);
    const statuses = result.ticketsByStatus.map((row) => [row.label, row.value]);

    expect(result.breachedOpen).toBe(1);
    expect(statuses).toEqual(
      expect.arrayContaining([
        ['OPEN', 1],
        ['IN_PROGRESS', 1],
        ['CLOSED', 1],
        ['RESOLVED', 1],
      ]),
    );
    expect(sum(result.ticketTrend.map((point) => point.opened))).toBe(4);
    expect(sum(result.ticketTrend.map((point) => point.resolved))).toBe(1);
    expect(result.slaMetPercent).toBe(100);
  });

  it('leaves dates outside the shown months out of the trend', async () => {
    const future = await ticket({ status: 'RESOLVED', resolvedAt: inDays(40) });
    await SupportTicketModel.collection.updateOne(
      { _id: future._id },
      { $set: { createdAt: inDays(40) } },
    );
    await ItIncidentModel.create({ title: 'Ahead', description: 'd', startedAt: inDays(40) });

    const result = await report(2);

    expect(sum(result.ticketTrend.map((point) => point.opened))).toBe(0);
    expect(sum(result.ticketTrend.map((point) => point.resolved))).toBe(0);
    expect(sum(result.incidentsByMonth.map((point) => point.value))).toBe(0);
    expect(result.incidentsBySeverity).toEqual([{ label: 'SEV3', value: 1 }]);
  });

  it('shows how much of each kind of in-service device is handed out', async () => {
    await AssetModel.create([
      { assetTag: 'L-1', name: 'L', category: 'LAPTOP', status: 'ASSIGNED' },
      { assetTag: 'L-2', name: 'L', category: 'LAPTOP', status: 'IN_STOCK' },
      { assetTag: 'M-1', name: 'M', category: 'MONITOR', status: 'ASSIGNED' },
      { assetTag: 'L-3', name: 'L', category: 'LAPTOP', status: 'RETIRED' },
    ]);

    const result = await report(3);
    const byCategory = [...result.assetUtilization].sort((a, b) =>
      a.category.localeCompare(b.category),
    );

    expect(byCategory).toEqual([
      { category: 'LAPTOP', total: 2, assigned: 1 },
      { category: 'MONITOR', total: 1, assigned: 1 },
    ]);
  });

  it('averages how long resolved incidents took and counts them per severity', async () => {
    const startedAt = new Date(Date.now() - 6 * HOUR);
    await ItIncidentModel.create([
      {
        title: 'A',
        description: 'd',
        severity: 'SEV1',
        startedAt,
        resolvedAt: new Date(startedAt.getTime() + 2 * HOUR),
      },
      {
        title: 'B',
        description: 'd',
        severity: 'SEV1',
        startedAt,
        resolvedAt: new Date(startedAt.getTime() + 4 * HOUR),
      },
      { title: 'C', description: 'd', severity: 'SEV2', startedAt },
    ]);

    // Two months, so six hours ago is inside the window even just after midnight on the 1st.
    const result = await report(2);

    expect(result.mttrHours).toBe(3);
    expect(result.incidentsBySeverity).toEqual(
      expect.arrayContaining([
        { label: 'SEV1', value: 2 },
        { label: 'SEV2', value: 1 },
      ]),
    );
    expect(sum(result.incidentsByMonth.map((point) => point.value))).toBe(3);
  });

  it('keeps everyone outside IT out', async () => {
    expect(await codeOf(q.itReport(null, {}, ctxFor('e-1', [ROLES.EMPLOYEE])))).toBe('FORBIDDEN');
  });
});
