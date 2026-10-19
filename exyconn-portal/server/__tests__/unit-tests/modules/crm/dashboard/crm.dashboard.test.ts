import { crmDashboardResolvers } from '../../../../../src/modules/crm/dashboard';
import { conversionInsight } from '../../../../../src/modules/crm/dashboard/crm.dashboard.insights';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const asSales: GraphQLContext = { user: { id: 'u-1', roles: [ROLES.CRM], email: 's@acme.test' } };
const DAY = 86_400_000;
const now = Date.now();
const FROM = new Date(now - 10 * DAY);
const TO = new Date(now + DAY);

type Dashboard = {
  granularity: string;
  kpis: Record<string, number | null>;
  pipelineByStage: { stage: string; count: number; value: number }[];
  wonOverTime: { key: string; value: number }[];
  leadsBySource: { source: string; count: number; won: number }[];
  activitiesOverTime: { call: number; task: number }[];
  topOwners: { owner: string; value: number }[];
  insights: { kind: string; tone: string; count: number; label: string; compareLabel?: string }[];
};

const dashboard = (ctx: GraphQLContext = asSales) =>
  crmDashboardResolvers.Query.crmDashboard(
    null,
    { from: FROM, to: TO },
    ctx,
  ) as unknown as Promise<Dashboard>;

const deal = (over: Record<string, unknown>) =>
  DealModel.create({ title: 'Deal', stage: 'PROPOSAL', value: 100, owner: 'Asha', ...over });
const lead = (source: string, stage: string) =>
  LeadModel.create({ name: 'L', email: 'l@x.test', source, stage, value: 0, owner: 'Asha' });

describe('the CRM dashboard', () => {
  it('adds up the open pipeline, the period’s wins and the win rate', async () => {
    await deal({ stage: 'PROPOSAL', value: 300, probability: 50 });
    await deal({ stage: 'NEGOTIATION', value: 200, probability: 100 });
    await deal({ stage: 'WON', value: 1000, owner: 'Ravi' });
    await deal({ stage: 'WON', value: 400, owner: 'Asha' });
    await deal({ stage: 'LOST', value: 50 });

    const result = await dashboard();

    expect(result.kpis).toMatchObject({
      openDealCount: 2,
      openPipelineValue: 500,
      weightedPipelineValue: 350,
      wonCount: 2,
      wonValue: 1400,
      lostCount: 1,
    });
    expect(result.kpis.winRate).toBeCloseTo(2 / 3);
    expect(result.pipelineByStage.find((row) => row.stage === 'PROPOSAL')).toEqual({
      stage: 'PROPOSAL',
      count: 1,
      value: 300,
    });
    expect(result.pipelineByStage.map((row) => row.stage)).toEqual([
      'QUALIFYING',
      'DISCOVERY',
      'PROPOSAL',
      'NEGOTIATION',
    ]);
    expect(result.topOwners).toEqual([
      { owner: 'Ravi', value: 1000, count: 1 },
      { owner: 'Asha', value: 400, count: 1 },
    ]);
    expect(result.granularity).toBe('DAY');
    expect(result.wonOverTime.reduce((sum, period) => sum + period.value, 0)).toBe(1400);
  });

  it('leaves a deal won before the period out of its wins', async () => {
    const old = await deal({ stage: 'WON', value: 999 });
    await DealModel.collection.updateOne(
      { _id: old._id },
      { $set: { closedAt: new Date(now - 40 * DAY) } },
    );

    const result = await dashboard();

    expect(result.kpis).toMatchObject({ wonCount: 0, wonValue: 0, winRate: null });
  });

  it('counts leads by source with their wins, and activities by type', async () => {
    await lead('REFERRAL', 'WON');
    await lead('WEBSITE', 'NEW');
    await ActivityModel.create({ type: 'CALL', subject: 'c', owner: 'A' });
    await ActivityModel.create({ type: 'TASK', subject: 't', owner: 'A' });

    const result = await dashboard();

    expect(result.kpis.newLeads).toBe(2);
    expect(result.leadsBySource).toEqual(
      expect.arrayContaining([
        { source: 'REFERRAL', count: 1, won: 1 },
        { source: 'WEBSITE', count: 1, won: 0 },
      ]),
    );
    const totals = result.activitiesOverTime.reduce(
      (sum, period) => ({ call: sum.call + period.call, task: sum.task + period.task }),
      { call: 0, task: 0 },
    );
    expect(totals).toEqual({ call: 1, task: 1 });
  });

  it('finds overdue reminders and tasks, stuck deals and late deals', async () => {
    const past = new Date(now - DAY);
    await ActivityModel.create({
      type: 'TASK',
      subject: 'r',
      owner: 'A',
      remindAt: past,
      dueDate: past,
    });
    await ActivityModel.create({ type: 'TASK', subject: 't', owner: 'A', dueDate: past });
    await ActivityModel.create({
      type: 'TASK',
      subject: 'done',
      owner: 'A',
      dueDate: past,
      done: true,
    });
    const stuck = await deal({ stage: 'NEGOTIATION', expectedCloseDate: past });
    await DealModel.collection.updateOne(
      { _id: stuck._id },
      { $set: { updatedAt: new Date(now - 45 * DAY) } },
    );

    const result = await dashboard();

    expect(result.kpis).toMatchObject({ overdueReminders: 1, overdueTasks: 1 });
    expect(result.insights.map((insight) => insight.kind)).toEqual([
      'OVERDUE_REMINDERS',
      'OVERDUE_TASKS',
      'STUCK_DEALS',
      'PAST_CLOSE_DATE',
    ]);
    expect(result.insights[2]).toMatchObject({ count: 1, label: 'NEGOTIATION', tone: 'WARNING' });
  });

  it('says which lead source converts better, once both have enough leads', async () => {
    for (let index = 0; index < 5; index += 1) {
      await lead('REFERRAL', index < 4 ? 'WON' : 'NEW');
      await lead('WEBSITE', index < 1 ? 'WON' : 'NEW');
    }

    const result = await dashboard();

    expect(result.insights).toContainEqual(
      expect.objectContaining({
        kind: 'LEAD_SOURCE_CONVERSION',
        tone: 'POSITIVE',
        label: 'REFERRAL',
        compareLabel: 'WEBSITE',
        ratio: 4,
      }),
    );
  });

  it('compares companies by where they came from and how many became clients', async () => {
    const company = (index: number, source: string, clientId: string) =>
      CompanyModel.create({
        name: `Co ${source} ${index}`,
        domain: `${source.toLowerCase()}-${index}.test`,
        origin: { source },
        clientId,
      });
    for (let index = 0; index < 6; index += 1) {
      await company(index, 'GOOGLE_PLACES', index < 4 ? `client-${index}` : '');
      await company(index, 'WEBSITE', index < 2 ? `client-w${index}` : '');
    }

    const result = await dashboard();

    expect(result.insights).toContainEqual(
      expect.objectContaining({
        kind: 'COMPANY_ORIGIN_CONVERSION',
        label: 'GOOGLE_PLACES',
        ratio: 2,
      }),
    );
  });

  it('is refused to somebody outside the CRM', async () => {
    const asEmployee: GraphQLContext = {
      user: { id: 'u-2', roles: [ROLES.EMPLOYEE], email: 'e@x.test' },
    };

    await expect(dashboard(asEmployee)).rejects.toThrow();
  });
});

describe('a conversion finding', () => {
  it('stays quiet on small samples, narrow gaps and groups that never convert', () => {
    const kind = 'LEAD_SOURCE_CONVERSION';
    expect(
      conversionInsight(kind, [
        { label: 'A', count: 4, converted: 4 },
        { label: 'B', count: 4, converted: 1 },
      ]),
    ).toBeNull();
    expect(
      conversionInsight(kind, [
        { label: 'A', count: 10, converted: 4 },
        { label: 'B', count: 10, converted: 3 },
      ]),
    ).toBeNull();
    expect(
      conversionInsight(kind, [
        { label: 'A', count: 10, converted: 4 },
        { label: 'B', count: 10, converted: 0 },
      ]),
    ).toBeNull();
    expect(conversionInsight(kind, [{ label: 'A', count: 10, converted: 4 }])).toBeNull();
  });
});
