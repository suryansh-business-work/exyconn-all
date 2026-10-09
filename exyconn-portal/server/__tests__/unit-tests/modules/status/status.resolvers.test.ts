import { statusResolvers } from '../../../../src/modules/status/status.resolvers';
import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { StatusIncidentModel } from '../../../../src/modules/status/status-incident.model';
import { StatusMaintenanceModel } from '../../../../src/modules/status/status-maintenance.model';
import { ProblemReportModel } from '../../../../src/modules/status/problem-report.model';
import {
  subscribeIpLimiter,
  subscribeLimiter,
} from '../../../../src/modules/status/status.subscribers';
import { resetReportLimits } from '../../../../src/modules/status/report-rate-limit';
import { submitProblemReport } from '../../../../src/modules/status/problem-report.service';
import { emailer } from '../../../../src/modules/email';
import { ROLES } from '../../../../src/constants/roles';
import { env } from '../../../../src/config/env';
import { OPERATOR_ORGANIZATION_ID, seedPlatformOperator } from '../../security-authz.operator';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendTemplate = emailer.send as jest.Mock;
const { Query, Mutation } = statusResolvers;

const tech: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.TECH], email: 'ops@exyconn.com' },
  organizationId: OPERATOR_ORGANIZATION_ID,
};
const sales: GraphQLContext = {
  user: { id: 'u2', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
  organizationId: OPERATOR_ORGANIZATION_ID,
};

const HOUR = 60 * 60 * 1000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs);

const report = {
  serviceKey: '',
  category: 'OTHER',
  severity: 'LOW',
  subject: 'Something is off',
  description: 'The dashboard shows yesterday’s numbers after a refresh.',
  reporterName: 'Asha Rao',
  reporterEmail: 'asha@example.com',
  pageUrl: '',
};

beforeEach(async () => {
  await seedPlatformOperator();
  await resetReportLimits();
  await Promise.all([subscribeLimiter.reset(), subscribeIpLimiter.reset()]);
});
afterEach(() => jest.restoreAllMocks());

describe('Public status resolvers', () => {
  it('serves the overview for the window asked for', async () => {
    await StatusMonitorModel.create({
      key: 'hr',
      name: 'HR Portal',
      category: 'PORTAL',
      url: 'https://hr.example.test',
    });

    const overview = await Query.statusOverview(null, { days: 7 });

    expect(overview.services).toHaveLength(1);
    expect(overview.daily).toHaveLength(7);
  });

  it('files a report under the caller address, and under one shared bucket without one', async () => {
    const receipt = await Mutation.submitProblemReport(
      null,
      { input: report },
      { user: null, ip: '198.51.100.30' },
    );
    expect(receipt.reference).toMatch(/^EXY-/);

    for (let index = 0; index < 10; index += 1) {
      await submitProblemReport({ ...report, subject: `Problem number ${index}` });
    }
    await expect(
      Mutation.submitProblemReport(null, { input: report }, { user: null }),
    ).rejects.toThrow('Too many reports');
  });

  it('subscribes with the request origin and address', async () => {
    const trusted = env.corsOrigins[0];

    await expect(
      Mutation.subscribeToStatus(
        null,
        { email: 'asha@example.com' },
        { user: null, origin: trusted, ip: '198.51.100.31' },
      ),
    ).resolves.toBe(true);

    const confirmUrl: string = sendTemplate.mock.calls[0][0].variables.confirmUrl;
    expect(confirmUrl.startsWith(`${trusted}/subscribe/confirm?token=`)).toBe(true);
  });
});

describe('Maintenance window edits', () => {
  const window = (startsAt: Date, endsAt: Date) => ({
    title: 'Database upgrade',
    body: 'Read-only API',
    affectedServiceKeys: ['api'],
    startsAt,
    endsAt,
  });

  it('refuses an edit that makes the window end before it starts', async () => {
    const saved = await StatusMaintenanceModel.create(window(at(HOUR), at(2 * HOUR)));

    expect(() =>
      Mutation.updateStatusMaintenance(
        null,
        { id: String(saved._id), input: window(at(2 * HOUR), at(2 * HOUR)) },
        tech,
      ),
    ).toThrow('end after it starts');
  });

  it('saves a valid edit', async () => {
    const saved = await StatusMaintenanceModel.create(window(at(HOUR), at(2 * HOUR)));
    const endsAt = at(3 * HOUR);

    await Mutation.updateStatusMaintenance(
      null,
      { id: String(saved._id), input: window(at(HOUR), endsAt) },
      tech,
    );

    expect((await StatusMaintenanceModel.findById(saved._id).lean())?.endsAt).toEqual(endsAt);
  });
});

describe('Incident deletion', () => {
  it('lets Tech delete an incident and refuses everybody else', async () => {
    const incident = await StatusIncidentModel.create({
      serviceKey: 'hr',
      serviceName: 'HR Portal',
      startedAt: new Date(),
    });
    const id = String(incident._id);

    await expect(
      codeOf(Promise.resolve(Mutation.deleteStatusIncident(null, { id } as never, sales))),
    ).resolves.toBe('FORBIDDEN');
    await expect(Mutation.deleteStatusIncident(null, { id } as never, tech)).resolves.toBe(true);
    expect(await StatusIncidentModel.countDocuments()).toBe(0);
  });
});

describe('Problem report triage', () => {
  const record = { ...report, serviceName: '', status: 'NEW', assignee: '', resolutionNotes: '' };

  it('is refused to a caller without the Tech role before anything is read', async () => {
    const saved = await ProblemReportModel.create(record);
    const read = jest.spyOn(ProblemReportModel, 'findById');

    await expect(
      codeOf(
        Mutation.updateProblemReport(
          null,
          { id: String(saved._id), input: { ...record, status: 'CLOSED' } },
          sales,
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
    expect(read).not.toHaveBeenCalled();
  });

  it('emails nobody when there was no earlier status to compare against', async () => {
    const saved = await ProblemReportModel.create(record);
    jest.spyOn(ProblemReportModel, 'findById').mockReturnValueOnce(
      asArg({
        select: () => ({ lean: () => Promise.resolve(null) }),
      }),
    );

    const updated = await Mutation.updateProblemReport(
      null,
      { id: String(saved._id), input: { ...record, status: 'RESOLVED' } },
      tech,
    );

    expect(updated.status).toBe('RESOLVED');
    expect(sendTemplate).not.toHaveBeenCalled();
  });
});
