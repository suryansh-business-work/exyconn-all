import { Types } from 'mongoose';
import { AssetModel } from '../../../../src/modules/assets/asset.model';
import { OnboardingChecklistModel } from '../../../../src/modules/onboarding/onboarding.model';
import { ExitRecordModel } from '../../../../src/modules/exit/exit.model';
import { ItAccessRequestModel, ItSettingsModel } from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, itMutation as m, itQuery as q, itStaff, person } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Joiner = {
  employeeName: string;
  items: Array<{ key: string }>;
  pendingItems: number;
  access: Array<{ application: string }>;
  missingApplications: string[];
};
type Leaver = {
  employeeId: string;
  employeeName: string;
  lastWorkingDate: Date | null;
  accountActive: boolean;
  assets: Array<{ assetTag: string }>;
  access: Array<{ application: string }>;
  revokesPending: number;
};

const grant = (employeeId: string, application: string, status = 'FULFILLED', kind = 'GRANT') =>
  ItAccessRequestModel.create({
    employeeId,
    application,
    kind,
    status,
    reason: 'r',
    fulfilledAt: status === 'FULFILLED' ? new Date() : null,
  });

const LAST_DAY = new Date('2026-10-31T00:00:00.000Z');

const item = (key: string, owner: string, done = false) => ({
  key,
  label: key,
  owner,
  dueOn: new Date(),
  done,
});

describe('IT onboarding and offboarding lists', () => {
  useTestOrganization();
  let ctx: GraphQLContext;

  beforeEach(async () => {
    ({ ctx } = await itStaff());
    await ItSettingsModel.create({
      key: 'global',
      applications: ['Email', 'Slack', 'Jira'],
      onboardingApplications: ['Email', 'Slack', 'Jira'],
    });
  });

  it('lists joiners with IT work, their IT items and the apps still to request', async () => {
    await OnboardingChecklistModel.create([
      {
        employeeId: 'joiner-1',
        employeeName: 'Asha Rao',
        templateName: 'Default',
        joinDate: new Date(),
        items: [item('laptop', 'IT'), item('vpn', 'IT', true), item('contract', 'HR')],
      },
      {
        employeeId: 'joiner-2',
        employeeName: 'HR only',
        templateName: 'Default',
        joinDate: new Date(),
        items: [item('contract', 'HR')],
      },
    ]);
    await grant('joiner-1', 'email');
    await grant('joiner-1', 'Slack', 'PENDING');

    const joiners = (await q.itOnboarding(null, {}, ctx)) as Joiner[];

    expect(joiners).toHaveLength(1);
    expect(joiners[0]).toMatchObject({ employeeName: 'Asha Rao', pendingItems: 1 });
    expect(joiners[0].items.map((row) => row.key)).toEqual(['laptop', 'vpn']);
    expect(joiners[0].access.map((row) => row.application)).toEqual(['email']);
    expect(joiners[0].missingApplications).toEqual(['Jira']);
  });

  it('lists leavers still being worked, with devices, access and revokes in flight', async () => {
    const asha = await person('Asha Rao');
    await ExitRecordModel.create([
      {
        employeeId: asha,
        resignationDate: new Date(),
        lastWorkingDate: LAST_DAY,
        stage: 'NOTICE_PERIOD',
      },
      { employeeId: 'legacy-7', resignationDate: new Date() },
      { employeeId: 'gone-1', resignationDate: new Date(), stage: 'EXITED' },
    ]);
    await AssetModel.create({ assetTag: 'L-1', name: 'L', status: 'ASSIGNED', assignedToId: asha });
    await grant(asha, 'Email');
    await grant(asha, 'Slack');
    await grant(asha, 'Slack', 'APPROVED', 'REVOKE');

    const leavers = (await q.itOffboarding(null, {}, ctx)) as Leaver[];
    const byId = new Map(leavers.map((row) => [row.employeeId, row]));

    expect(leavers).toHaveLength(2);
    expect(byId.get(asha)).toMatchObject({
      employeeName: 'Asha Rao',
      accountActive: true,
      lastWorkingDate: LAST_DAY,
    });
    expect(byId.get(asha)?.assets.map((row) => row.assetTag)).toEqual(['L-1']);
    expect(byId.get(asha)?.access).toHaveLength(2);
    expect(byId.get(asha)?.revokesPending).toBe(1);
    expect(byId.get('legacy-7')).toMatchObject({
      employeeName: 'legacy-7',
      lastWorkingDate: null,
      accountActive: false,
      assets: [],
      access: [],
      revokesPending: 0,
    });
  });

  it('refuses to provision an employee who does not exist', async () => {
    const provision = (employeeId: string) => m.itProvisionOnboarding(null, { employeeId }, ctx);

    expect(await codeOf(provision('nope'))).toBe('NOT_FOUND');
    expect(await codeOf(provision(String(new Types.ObjectId())))).toBe('NOT_FOUND');
  });

  it('revokes only what has no revoke open, under the offboarding policy', async () => {
    const asha = await person('Asha Rao');
    await grant(asha, 'Email');
    await grant(asha, 'Slack');
    await grant(asha, 'Slack', 'PENDING', 'REVOKE');

    const revokes = (await m.itRevokeAllAccess(null, { employeeId: asha }, ctx)) as Array<{
      application: string;
      decidedByName: string;
      reason: string;
    }>;

    expect(revokes).toEqual([
      expect.objectContaining({
        application: 'Email',
        decidedByName: 'Offboarding policy',
        reason: 'Employee offboarding',
      }),
    ]);
  });

  it('keeps everyone outside IT out of both lists', async () => {
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    expect(await codeOf(q.itOnboarding(null, {}, employee))).toBe('FORBIDDEN');
    expect(await codeOf(q.itOffboarding(null, {}, employee))).toBe('FORBIDDEN');
  });
});
