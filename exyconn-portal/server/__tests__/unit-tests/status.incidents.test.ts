import { statusResolvers } from '../../src/modules/status';
import { StatusMonitorModel } from '../../src/modules/status/status-monitor.model';
import { StatusIncidentModel } from '../../src/modules/status/status-incident.model';
import { StatusMaintenanceModel } from '../../src/modules/status/status-maintenance.model';
import { ProblemReportModel } from '../../src/modules/status/problem-report.model';
import { resetReportLimits } from '../../src/modules/status/report-rate-limit';
import { TrackerBuildSettingsModel } from '../../src/modules/tech/tracker-build-settings.model';
import { getStatusOverview, runStatusChecks } from '../../src/modules/status';
import { emailer } from '../../src/modules/email';
import { slackNotifier } from '../../src/utils/slack';
import { mailer } from '../../src/utils/mailer';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/utils/slack', () => ({
  slackNotifier: { sendMessage: jest.fn() },
}));
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendSlack = slackNotifier.sendMessage as jest.Mock;
const sendTeamEmail = mailer.sendCustomEmail as jest.Mock;
const sendTemplate = emailer.send as jest.Mock;

const tech: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.TECH], email: 'ops@exyconn.com' },
};
const sales: GraphQLContext = {
  user: { id: 'u2', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const monitors = [
  { key: 'hr', name: 'HR Portal', category: 'PORTAL', url: 'https://hr.example.test', order: 0 },
  { key: 'api', name: 'Portal API', category: 'API', url: 'https://api.example.test', order: 1 },
];

const HOUR = 60 * 60 * 1000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs);

const createIncident = (ctx: GraphQLContext, keys = ['api', 'hr']) =>
  statusResolvers.Mutation.createStatusIncident(
    null,
    { input: { title: 'Logins failing', impact: 'CRITICAL', affectedServiceKeys: keys, body: 'Looking into it' } },
    ctx,
  ) as Promise<{ id: string; serviceKey: string; updates: Array<{ status: string }> }>;

const addUpdate = (id: string, status: string, body: string, ctx = tech) =>
  statusResolvers.Mutation.addStatusIncidentUpdate(
    null,
    { id, status: status as never, body },
    ctx,
  );

const createMaintenance = (input: Record<string, unknown>, ctx = tech) =>
  statusResolvers.Mutation.createStatusMaintenance(null, { input } as never, ctx);

beforeEach(async () => {
  await StatusMonitorModel.create(monitors);
});

describe('Manual incidents', () => {
  it('opens under the first affected service with an investigating update', async () => {
    const incident = await createIncident(tech);

    const saved = await StatusIncidentModel.findById(incident.id).lean();
    expect(saved).toMatchObject({
      source: 'MANUAL',
      impact: 'CRITICAL',
      state: 'DOWN',
      serviceKey: 'hr',
      serviceName: 'HR Portal',
      affectedServiceKeys: ['hr', 'api'],
      resolvedAt: null,
    });
    expect(saved?.updates).toHaveLength(1);
    expect(saved?.updates[0]).toMatchObject({
      status: 'INVESTIGATING',
      body: 'Looking into it',
      authorName: 'ops@exyconn.com',
    });
  });

  it('refuses an incident with no known service', async () => {
    await expect(createIncident(tech, ['ghost'])).rejects.toThrow('at least one');
  });

  it('is Tech-only', async () => {
    await expect(createIncident(sales)).rejects.toThrow();
    expect(await StatusIncidentModel.countDocuments()).toBe(0);
  });

  it('walks the timeline and alerts the team on RESOLVED', async () => {
    await TrackerBuildSettingsModel.create({ key: 'default', statusAlertChannels: ['C1'] });
    await seedUser('ops@exyconn.com', 'a-strong-password', [ROLES.TECH]);
    const incident = await createIncident(tech);

    await addUpdate(incident.id, 'IDENTIFIED', 'A bad certificate');
    expect(sendSlack).not.toHaveBeenCalled();

    await addUpdate(incident.id, 'RESOLVED', 'Certificate renewed');

    const saved = await StatusIncidentModel.findById(incident.id).lean();
    expect(saved?.resolvedAt).toBeInstanceOf(Date);
    expect(saved?.updates.map((update) => update.status)).toEqual([
      'INVESTIGATING',
      'IDENTIFIED',
      'RESOLVED',
    ]);
    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(sendSlack.mock.calls[0][0]).toContain('HR Portal is back up');
    expect(sendTeamEmail).toHaveBeenCalledTimes(1);
    expect(sendTeamEmail.mock.calls[0][0]).toMatchObject({ email: 'ops@exyconn.com' });
  });

  it('refuses an update on a resolved incident', async () => {
    const incident = await createIncident(tech);
    await addUpdate(incident.id, 'RESOLVED', 'Done');

    await expect(addUpdate(incident.id, 'MONITORING', 'Again')).rejects.toThrow('already resolved');
  });

  it('is listed on the public page with its updates newest first', async () => {
    const incident = await createIncident(tech);
    await addUpdate(incident.id, 'MONITORING', 'Watching');

    const overview = await getStatusOverview(1);

    expect(overview.incidents).toHaveLength(1);
    expect(overview.incidents[0]).toMatchObject({ title: 'Logins failing', impact: 'CRITICAL' });
    expect(overview.incidents[0].updates.map((update) => update.status)).toEqual([
      'MONITORING',
      'INVESTIGATING',
    ]);
  });
});

describe('Monitor-opened incidents', () => {
  it('carries the automatic updates through open and close', async () => {
    await StatusMonitorModel.deleteMany({ key: 'api' });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    await runStatusChecks();
    await runStatusChecks();

    const opened = await StatusIncidentModel.findOne({ serviceKey: 'hr' }).lean();
    expect(opened).toMatchObject({
      source: 'MONITOR',
      title: 'HR Portal is down',
      affectedServiceKeys: ['hr'],
    });
    expect(opened?.updates).toHaveLength(1);
    expect(opened?.updates[0]).toMatchObject({ status: 'INVESTIGATING', authorName: 'Status monitor' });
    expect(opened?.updates[0].body).toContain('HTTP 503');

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;
    await runStatusChecks();

    const closed = await StatusIncidentModel.findOne({ serviceKey: 'hr' }).lean();
    expect(closed?.resolvedAt).toBeInstanceOf(Date);
    expect(closed?.updates.map((update) => update.status)).toEqual(['INVESTIGATING', 'RESOLVED']);
  });
});

describe('Maintenance windows', () => {
  const window = (startsAt: Date, endsAt: Date, title: string) => ({
    title,
    body: 'Database upgrade',
    affectedServiceKeys: ['api'],
    startsAt,
    endsAt,
  });

  it('shows upcoming and in-progress windows on the public page, soonest first', async () => {
    await createMaintenance(window(at(-3 * HOUR), at(-2 * HOUR), 'Finished'));
    await createMaintenance(window(at(-1 * HOUR), at(1 * HOUR), 'Now'));
    await createMaintenance(window(at(24 * HOUR), at(26 * HOUR), 'Tomorrow'));

    const overview = await getStatusOverview(1);

    expect(overview.maintenance.map((entry) => entry.title)).toEqual(['Now', 'Tomorrow']);
    expect(overview.maintenance.map((entry) => entry.inProgress)).toEqual([true, false]);
    expect(overview.maintenance[0].affectedServiceKeys).toEqual(['api']);
  });

  it('stamps who planned it and refuses a window that ends first', async () => {
    await createMaintenance(window(at(HOUR), at(2 * HOUR), 'Planned'));
    expect((await StatusMaintenanceModel.findOne().lean())?.createdBy).toBe('ops@exyconn.com');

    await expect(createMaintenance(window(at(2 * HOUR), at(HOUR), 'Backwards'))).rejects.toThrow(
      'end after it starts',
    );
    await expect(createMaintenance(window(at(HOUR), at(2 * HOUR), 'Nope'), sales)).rejects.toThrow();
  });
});

describe('Problem report follow-up', () => {
  const report = {
    serviceKey: 'hr',
    serviceName: 'HR Portal',
    category: 'LOGIN',
    severity: 'HIGH',
    status: 'NEW',
    subject: 'Cannot sign in to HR',
    description: 'The sign-in button spins forever on every browser I tried.',
    reporterName: 'Asha Rao',
    reporterEmail: 'asha@example.com',
    pageUrl: '',
    assignee: '',
    resolutionNotes: '',
  };

  const update = (id: string, patch: Partial<typeof report>) =>
    statusResolvers.Mutation.updateProblemReport(
      null,
      { id, input: { ...report, ...patch } },
      tech,
    );

  beforeEach(() => resetReportLimits());

  it('emails the reporter when the status changes, with the notes', async () => {
    const saved = await ProblemReportModel.create(report);

    await update(String(saved._id), { status: 'RESOLVED', resolutionNotes: 'Session store fixed' });

    expect(sendTemplate).toHaveBeenCalledTimes(1);
    expect(sendTemplate.mock.calls[0][0]).toMatchObject({
      template: 'problem-report-update',
      to: 'asha@example.com',
      variables: {
        reference: saved.reference,
        status: 'Resolved',
        serviceName: 'HR Portal',
        resolutionNotes: 'Session store fixed',
      },
    });
  });

  it('stays quiet when only the assignee changes', async () => {
    const saved = await ProblemReportModel.create(report);

    await update(String(saved._id), { assignee: 'Dev' });

    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it('lets a reporter look up their report by reference, and nothing more', async () => {
    const saved = await ProblemReportModel.create({ ...report, status: 'IN_PROGRESS' });

    const status = await statusResolvers.Query.problemReportStatus(
      null,
      { reference: saved.reference.toLowerCase() },
      { user: null, ip: '203.0.113.5' },
    );

    expect(status).toEqual({
      reference: saved.reference,
      status: 'IN_PROGRESS',
      serviceName: 'HR Portal',
      updatedAt: expect.any(Date),
    });
    expect(status).not.toHaveProperty('description');
  });

  it('rejects an unknown reference and a flood of lookups', async () => {
    await expect(
      statusResolvers.Query.problemReportStatus(null, { reference: 'EXY-NOPE00' }, { user: null }),
    ).rejects.toThrow('No report');

    const ctx = { user: null, ip: '203.0.113.9' };
    for (let index = 0; index < 10; index += 1) {
      await statusResolvers.Query.problemReportStatus(null, { reference: 'EXY-X' }, ctx).catch(
        () => undefined,
      );
    }
    await expect(
      statusResolvers.Query.problemReportStatus(null, { reference: 'EXY-X' }, ctx),
    ).rejects.toThrow('Too many lookups');
  });
});
