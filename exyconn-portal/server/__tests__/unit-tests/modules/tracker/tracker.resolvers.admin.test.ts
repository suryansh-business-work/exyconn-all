import { admin, as, manual, ME, messages } from './resolverMocks';
import { ROLES } from '../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { recordAudit } from '../../../../src/modules/audit';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { trackerResolvers } from '../../../../src/modules/tracker/tracker.resolvers';
import { codeOf } from '../codeOf';

const Mutation = trackerResolvers.Mutation;
const monitor = as(ROLES.TRACKER);

beforeEach(() => {
  invalidatePermissionCache();
});

describe('granting and revoking access', () => {
  it('grants as the signed-in administrator and audits it', async () => {
    admin.grantAccess.mockResolvedValue({ _id: 'g1', userId: 'u1', isActive: true });

    const access = await Mutation.grantTrackerAccess(null, { userId: 'u1' }, monitor);

    expect(admin.grantAccess).toHaveBeenCalledWith('u1', ME);
    expect(access).toMatchObject({ id: 'g1', isActive: true });
    expect(recordAudit).toHaveBeenCalledWith(monitor, {
      action: 'ACCESS',
      module: 'Tracker',
      entityId: 'u1',
      summary: 'Granted tracker access to user u1',
    });
  });

  it('revokes access and a device, auditing each', async () => {
    admin.revokeAccess.mockResolvedValue({ _id: 'g1', isActive: false });
    admin.revokeDevice.mockResolvedValue({ _id: 'row-1', deviceId: 'laptop-1' });

    await Mutation.revokeTrackerAccess(null, { userId: 'u1' }, monitor);
    const revoked = await Mutation.revokeTrackerDevice(null, { deviceId: 'laptop-1' }, monitor);

    expect(admin.revokeAccess).toHaveBeenCalledWith('u1', ME);
    expect(revoked).toMatchObject({ id: 'row-1' });
    expect(recordAudit).toHaveBeenCalledWith(monitor, {
      action: 'ACCESS',
      module: 'Tracker',
      entityId: 'u1',
      summary: 'Revoked tracker access from user u1',
    });
    expect(recordAudit).toHaveBeenCalledWith(monitor, {
      action: 'ACCESS',
      module: 'Tracker',
      entityId: 'laptop-1',
      entityLabel: 'laptop-1',
      summary: 'Revoked tracker device laptop-1',
    });
  });

  it('refuses an employee, and audits nothing', async () => {
    const employee = as(ROLES.EMPLOYEE);

    await expect(
      codeOf(Mutation.grantTrackerAccess(null, { userId: 'u1' }, employee)),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      codeOf(Mutation.revokeTrackerDevice(null, { deviceId: 'laptop-1' }, employee)),
    ).resolves.toBe('FORBIDDEN');
    expect(admin.grantAccess).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('honours a permission matrix that leaves the tracker role read-only', async () => {
    await RolePermissionModel.create({ role: ROLES.TRACKER, module: 'Tracker', actions: ['VIEW'] });

    await expect(
      codeOf(Mutation.grantTrackerAccess(null, { userId: 'u1' }, monitor)),
    ).resolves.toBe('FORBIDDEN');
    // An administrator is never restricted by the matrix.
    admin.grantAccess.mockResolvedValue({ _id: 'g1' });
    await expect(
      codeOf(Mutation.grantTrackerAccess(null, { userId: 'u1' }, as(ROLES.ADMIN))),
    ).resolves.toBe('OK');
  });
});

describe('reviewing claims and messaging employees', () => {
  it('reviews a claim as the signed-in reviewer', async () => {
    manual.review.mockResolvedValue({ _id: 'm1', status: 'APPROVED' });

    const reviewed = await Mutation.reviewTrackerManualEntry(
      null,
      { id: 'm1', status: 'APPROVED', reviewNote: 'Fine' },
      monitor,
    );

    expect(manual.review).toHaveBeenCalledWith('m1', 'APPROVED', ME, 'Fine');
    expect(reviewed).toMatchObject({ id: 'm1', status: 'APPROVED' });
  });

  it('writes to an employee in the admin-to-employee direction', async () => {
    messages.send.mockResolvedValue({ _id: 'c1', body: 'Hello' });

    const message = await Mutation.sendTrackerMessage(
      null,
      { userId: 'u1', body: 'Hello' },
      monitor,
    );

    expect(messages.send).toHaveBeenCalledWith('u1', 'TO_EMPLOYEE', 'Hello', ME);
    expect(message).toMatchObject({ id: 'c1' });
  });

  it('broadcasts a notice, answers how many it reached, and audits it', async () => {
    messages.broadcast.mockResolvedValue([{ _id: 'n1' }, { _id: 'n2' }]);
    const input = { title: 'Office closed', body: 'Friday is a holiday.' };

    await expect(Mutation.sendTrackerNotice(null, { input }, monitor)).resolves.toBe(2);

    expect(messages.broadcast).toHaveBeenCalledWith(input, ME);
    expect(recordAudit).toHaveBeenCalledWith(monitor, {
      action: 'CREATE',
      module: 'Tracker',
      entityLabel: 'Office closed',
      summary: 'Sent tracker notice "Office closed" to 2 employee(s)',
    });
  });

  it('marks what an employee sent to the desk as read', async () => {
    messages.markRead.mockResolvedValue(3);

    await expect(Mutation.markTrackerThreadRead(null, { userId: 'u1' }, monitor)).resolves.toBe(3);
    expect(messages.markRead).toHaveBeenCalledWith('u1', 'TO_ADMIN');
  });

  it('saves settings for the tracker role only', async () => {
    jest.mocked(updateTrackerSettings).mockResolvedValue({ _id: 'settings-1' } as never);

    await expect(
      Mutation.updateTrackerSettings(null, { input: { intervalMinutes: 5 } }, monitor),
    ).resolves.toMatchObject({ id: 'settings-1' });
    expect(updateTrackerSettings).toHaveBeenCalledWith({ intervalMinutes: 5 });
    await expect(
      codeOf(Mutation.updateTrackerSettings(null, { input: {} }, as(ROLES.FINANCE))),
    ).resolves.toBe('FORBIDDEN');
  });
});
