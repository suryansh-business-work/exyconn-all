import { UserModel } from '../../src/modules/admin/user.model';
import { itsmResolvers } from '../../src/modules/itsm';
import { activeAccessOf } from '../../src/modules/itsm/access';
import { ItSettingsModel } from '../../src/modules/itsm/models';
import { ExitRecordModel } from '../../src/modules/exit/exit.model';
import { approvalsResolvers } from '../../src/modules/approvals';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const q = itsmResolvers.Query as unknown as Record<string, Resolver>;
const m = itsmResolvers.Mutation as unknown as Record<string, Resolver>;
const decideApproval = approvalsResolvers.Mutation.decideApproval as unknown as Resolver;
const myApprovals = approvalsResolvers.Query.myApprovals as unknown as Resolver;

const ctx = (id: string, roles: string[] = [ROLES.IT]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const HOUR = 3_600_000;

async function person(name: string, roles: string[] = [ROLES.EMPLOYEE]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles,
  });
  return String(user._id);
}

describe('IT workflows', () => {
  useTestOrganization();
  let it1: GraphQLContext;
  let asha: string;

  beforeEach(async () => {
    it1 = ctx(await person('Ira Tech', [ROLES.IT]), [ROLES.IT]);
    asha = await person('Asha Rao');
  });

  const request = (application: string, kind = 'GRANT') =>
    m.createItAccessRequest(
      null,
      { input: { employeeId: asha, application, kind, reason: 'Needs it for work' } },
      it1,
    ) as Promise<{ id: string; status: string; employeeName: string }>;

  describe('access requests', () => {
    it('opens PENDING with the employee named, whatever the client sends', async () => {
      const created = await request('Figma');

      expect(created).toMatchObject({ status: 'PENDING', employeeName: 'Asha Rao' });
    });

    it('goes approve → fulfil, and only fulfilled access counts as held', async () => {
      const created = await request('Figma');
      await m.decideItAccessRequest(null, { id: created.id, decision: 'APPROVED' }, it1);
      expect(await activeAccessOf([asha])).toEqual([]);

      await m.fulfilItAccessRequest(null, { id: created.id }, it1);

      expect((await activeAccessOf([asha])).map((grant) => grant.application)).toEqual(['Figma']);
    });

    it('refuses to decide the same request twice', async () => {
      const created = await request('Figma');
      await m.decideItAccessRequest(null, { id: created.id, decision: 'REJECTED' }, it1);

      await expect(
        m.decideItAccessRequest(null, { id: created.id, decision: 'APPROVED' }, it1),
      ).rejects.toThrow('already been decided');
    });

    it('will not fulfil a request nobody approved', async () => {
      const created = await request('Figma');

      await expect(m.fulfilItAccessRequest(null, { id: created.id }, it1)).rejects.toThrow();
    });

    it('takes access away with a fulfilled revoke, and ignores password resets', async () => {
      for (const [app, kind] of [
        ['Slack', 'GRANT'],
        ['Slack', 'REVOKE'],
        ['Email', 'PASSWORD_RESET'],
      ]) {
        const created = await request(app, kind);
        await m.decideItAccessRequest(null, { id: created.id, decision: 'APPROVED' }, it1);
        await m.fulfilItAccessRequest(null, { id: created.id }, it1);
      }

      expect(await activeAccessOf([asha])).toEqual([]);
    });

    it('refuses an employee who does not exist', async () => {
      await expect(
        m.createItAccessRequest(
          null,
          { input: { employeeId: 'nope', application: 'X', kind: 'GRANT', reason: 'r' } },
          it1,
        ),
      ).rejects.toThrow('Pick an employee');
    });

    it('is decided from the shared approvals queue too', async () => {
      const created = await request('Jira');
      const queue = (await myApprovals(null, {}, it1)) as { items: Array<{ id: string }> };
      expect(queue.items.map((item) => item.id)).toContain(`IT_ACCESS:${created.id}`);

      await decideApproval(
        null,
        { id: `IT_ACCESS:${created.id}`, decision: 'APPROVED', note: 'ok' },
        it1,
      );

      const saved = (await q.getItAccessRequest(null, { id: created.id }, it1)) as {
        status: string;
        decidedByName: string;
      };
      expect(saved).toMatchObject({ status: 'APPROVED', decidedByName: 'Ira Tech' });
    });

    it('keeps other roles out', async () => {
      await expect(q.listItAccessRequests(null, {}, ctx(asha, [ROLES.EMPLOYEE]))).rejects.toThrow();
    });
  });

  describe('changes', () => {
    const change = (status: string, type = 'NORMAL') => ({
      title: 'Upgrade Mongo',
      description: 'Minor version bump',
      type,
      risk: 'MEDIUM',
      environment: 'PRODUCTION',
      system: 'Database',
      status,
      plannedStart: new Date(Date.now() + HOUR),
      plannedEnd: new Date(Date.now() + 2 * HOUR),
    });

    it('will not be scheduled before it is approved', async () => {
      await expect(m.createItChange(null, { input: change('SCHEDULED') }, it1)).rejects.toThrow(
        'must be approved',
      );
    });

    it('lets a STANDARD change go straight to scheduled', async () => {
      const created = (await m.createItChange(
        null,
        { input: change('SCHEDULED', 'STANDARD') },
        it1,
      )) as { status: string };

      expect(created.status).toBe('SCHEDULED');
    });

    it('refuses approval from the form, and stamps when it was implemented', async () => {
      const created = (await m.createItChange(
        null,
        { input: change('PENDING_APPROVAL') },
        it1,
      )) as { id: string };
      await expect(
        m.updateItChange(null, { id: created.id, input: change('APPROVED') }, it1),
      ).rejects.toThrow('approval action');

      await m.decideItChange(null, { id: created.id, decision: 'APPROVED' }, it1);
      const done = (await m.updateItChange(
        null,
        { id: created.id, input: change('IMPLEMENTED') },
        it1,
      )) as { implementedAt: Date | null };

      expect(done.implementedAt).toBeInstanceOf(Date);
    });

    it('refuses a window that ends before it starts', async () => {
      const input = { ...change('DRAFT'), plannedEnd: new Date(Date.now() - HOUR) };

      await expect(m.createItChange(null, { input }, it1)).rejects.toThrow('must end after');
    });
  });

  describe('incidents', () => {
    const incident = (status: string) => ({
      title: 'VPN down',
      description: 'Nobody can connect',
      severity: 'SEV2',
      category: 'NETWORK',
      status,
      startedAt: new Date(Date.now() - HOUR),
    });

    it('keeps a timeline that follows every status change', async () => {
      const created = (await m.createItIncident(
        null,
        { input: incident('INVESTIGATING') },
        it1,
      )) as { id: string };
      await m.addItIncidentUpdate(
        null,
        { id: created.id, status: 'IDENTIFIED', note: 'Expired certificate' },
        it1,
      );
      const resolved = (await m.updateItIncident(
        null,
        { id: created.id, input: incident('RESOLVED') },
        it1,
      )) as { resolvedAt: Date | null; timeline: Array<{ status: string; authorName: string }> };

      expect(resolved.timeline.map((entry) => entry.status)).toEqual([
        'INVESTIGATING',
        'IDENTIFIED',
        'RESOLVED',
      ]);
      expect(resolved.timeline[1].authorName).toBe('Ira Tech');
      expect(resolved.resolvedAt).toBeInstanceOf(Date);
    });

    it('clears the resolution when an incident reopens', async () => {
      const created = (await m.createItIncident(null, { input: incident('RESOLVED') }, it1)) as {
        id: string;
      };
      const reopened = (await m.addItIncidentUpdate(
        null,
        { id: created.id, status: 'INVESTIGATING', note: 'It is back' },
        it1,
      )) as { resolvedAt: Date | null };

      expect(reopened.resolvedAt).toBeNull();
    });
  });

  describe('purchases', () => {
    const purchase = (status: string) => ({
      title: 'Laptops',
      kind: 'HARDWARE',
      quantity: 2,
      estimatedCost: 3000,
      justification: 'Two joiners',
      status,
    });

    it('orders only after approval, and stamps delivery', async () => {
      const created = (await m.createItPurchaseRequest(
        null,
        { input: purchase('REQUESTED') },
        it1,
      )) as { id: string };
      await expect(
        m.updateItPurchaseRequest(null, { id: created.id, input: purchase('ORDERED') }, it1),
      ).rejects.toThrow('must be approved');

      await m.decideItPurchaseRequest(null, { id: created.id, decision: 'APPROVED' }, it1);
      const received = (await m.updateItPurchaseRequest(
        null,
        { id: created.id, input: purchase('RECEIVED') },
        it1,
      )) as { receivedAt: Date | null };

      expect(received.receivedAt).toBeInstanceOf(Date);
    });
  });

  describe('onboarding and offboarding', () => {
    beforeEach(() =>
      ItSettingsModel.create({
        key: 'global',
        applications: ['Email', 'Slack', 'Jira'],
        onboardingApplications: ['Email', 'Slack'],
      }),
    );

    it('opens pre-approved grants for the missing onboarding apps, once', async () => {
      const created = (await m.itProvisionOnboarding(null, { employeeId: asha }, it1)) as Array<{
        application: string;
        status: string;
      }>;

      expect(created.map((row) => [row.application, row.status])).toEqual([
        ['Email', 'APPROVED'],
        ['Slack', 'APPROVED'],
      ]);
      await expect(m.itProvisionOnboarding(null, { employeeId: asha }, it1)).rejects.toThrow(
        'already has',
      );
    });

    it('revokes everything a leaver still holds', async () => {
      const grants = (await m.itProvisionOnboarding(null, { employeeId: asha }, it1)) as Array<{
        id: string;
      }>;
      for (const grant of grants) {
        await m.fulfilItAccessRequest(null, { id: grant.id }, it1);
      }

      const revokes = (await m.itRevokeAllAccess(null, { employeeId: asha }, it1)) as Array<{
        kind: string;
      }>;

      expect(revokes.map((row) => row.kind)).toEqual(['REVOKE', 'REVOKE']);
      await expect(m.itRevokeAllAccess(null, { employeeId: asha }, it1)).rejects.toThrow(
        'Nothing left',
      );
    });
  });

  describe('disabling a leaver', () => {
    const leave = (employeeId: string, stage = 'NOTICE_PERIOD') =>
      ExitRecordModel.create({ employeeId, resignationDate: new Date(), stage });

    it('switches off someone with an exit on record', async () => {
      await leave(asha);

      const updated = (await m.itDisableLeaverAccount(null, { employeeId: asha }, it1)) as {
        isActive: boolean;
      };

      expect(updated.isActive).toBe(false);
    });

    it('refuses someone who is not leaving, or whose exit was withdrawn', async () => {
      await expect(m.itDisableLeaverAccount(null, { employeeId: asha }, it1)).rejects.toThrow(
        'recorded as leaving',
      );
      await leave(asha, 'WITHDRAWN');
      await expect(m.itDisableLeaverAccount(null, { employeeId: asha }, it1)).rejects.toThrow(
        'recorded as leaving',
      );
    });

    it('never disables an administrator', async () => {
      const boss = await person('Bo Admin', [ROLES.ADMIN]);
      await leave(boss);

      await expect(m.itDisableLeaverAccount(null, { employeeId: boss }, it1)).rejects.toThrow(
        'only be disabled in Admin',
      );
    });
  });

  describe('settings', () => {
    it('cleans lists and refuses an onboarding app that is not an application', async () => {
      const input = {
        applications: [' Email ', 'email', 'Slack', ''],
        onboardingApplications: ['Email'],
        ticketTopics: ['VPN', 'vpn'],
        warrantyWarningDays: 60,
        renewalWarningDays: 30,
        certificateWarningDays: 30,
      };
      const saved = (await m.updateItSettings(null, { input }, it1)) as {
        applications: string[];
        ticketTopics: string[];
      };
      expect(saved.applications).toEqual(['Email', 'Slack']);
      expect(saved.ticketTopics).toEqual(['VPN']);

      await expect(
        m.updateItSettings(null, { input: { ...input, onboardingApplications: ['Zoom'] } }, it1),
      ).rejects.toThrow('must also be in the applications list');
    });
  });
});
