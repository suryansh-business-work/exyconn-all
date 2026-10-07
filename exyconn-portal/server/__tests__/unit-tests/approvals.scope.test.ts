import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { RolePermissionModel } from '../../src/modules/permissions/permission.model';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import {
  decideApproval,
  myApprovals,
  myPendingApprovalCount,
} from '../../src/modules/approvals/approvals.service';
import { sourceByKind } from '../../src/modules/approvals/approvals.registry';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const ctx = (id: string, roles: Role[] = [ROLES.EMPLOYEE]): GraphQLContext => ({
  user: { id, email: `${id}@exyconn.com`, roles },
});

const person = async (name: string, managerId: string | null = null) => {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    managerId,
  });
  return String(user._id);
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const leaveFor = (employeeId: string) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'UNPAID',
    fromDate: day('2026-03-02'),
    toDate: day('2026-03-04'),
    reason: 'Family',
    status: 'PENDING',
  });

beforeEach(() => invalidatePermissionCache());

describe('how far a caller reaches into a source', () => {
  it('drops an HR role to the reporting line once APPROVE is taken off leave', async () => {
    const hr = await person('Hana');
    const report = await person('Ravi', hr);
    const stranger = await person('Omar');
    await leaveFor(report);
    await leaveFor(stranger);
    await RolePermissionModel.create({ role: ROLES.HR, module: 'LeaveRequest', actions: ['VIEW'] });

    const queue = await myApprovals(ctx(hr, [ROLES.HR]));

    // Only the leave raised by somebody who reports to them survives the restriction.
    const leave = queue.items.filter((item) => item.kind === 'LEAVE');
    expect(leave).toHaveLength(1);
    expect(leave[0].requestedById).toBe(report);
  });

  it('hides the leave queue entirely from a restricted HR role that manages nobody', async () => {
    const hr = await person('Hana');
    await leaveFor(await person('Omar'));
    await RolePermissionModel.create({ role: ROLES.HR, module: 'LeaveRequest', actions: ['VIEW'] });

    const queue = await myApprovals(ctx(hr, [ROLES.HR]));

    const kinds = queue.groups.map((group) => group.kind);
    expect(kinds).not.toContain('LEAVE');
    expect(kinds).toContain('REQUEST');
    expect(queue.totalCount).toBe(0);
  });

  it('treats a caller with no roles on the token as a plain employee', async () => {
    const manager = await person('Meera');
    await leaveFor(await person('Ravi', manager));
    const noRoles = {
      user: { id: manager, email: 'meera@exyconn.com' },
    } as unknown as GraphQLContext;

    const queue = await myApprovals(noRoles);

    expect(queue.totalCount).toBe(1);
    expect(queue.items[0].kind).toBe('LEAVE');
    await expect(myPendingApprovalCount(noRoles)).resolves.toBe(1);
  });

  it('names a requester it cannot find as Unknown', async () => {
    const admin = await person('Root');
    await leaveFor('not-an-object-id');
    await leaveFor(String(new Types.ObjectId()));

    const queue = await myApprovals(ctx(admin, [ROLES.ADMIN]));

    expect(queue.items).toHaveLength(2);
    expect(queue.items.map((item) => item.requestedByName)).toEqual(['Unknown', 'Unknown']);
  });

  it('builds the row the portal links to, with a composite id and the day count', async () => {
    const admin = await person('Root');
    const report = await person('Ravi');
    const leave = await leaveFor(report);

    const [item] = (await myApprovals(ctx(admin, [ROLES.ADMIN]), 'LEAVE')).items;

    expect(item).toMatchObject({
      id: `LEAVE:${leave._id}`,
      kindLabel: 'Leave Request',
      link: '/hr/leave',
      title: 'unpaid leave — 3 day(s)',
      summary: 'Family',
      requestedByName: 'Ravi',
      amount: null,
      currency: null,
    });
  });
});

describe('approval ids', () => {
  it.each([':abc', 'LEAVE:'])('refuses %p, which has only one half', async (id) => {
    const admin = await person('Root');

    await expect(decideApproval(ctx(admin, [ROLES.ADMIN]), id, 'APPROVED')).rejects.toThrow(
      /KIND:recordId/,
    );
  });

  it('looks a source up by its kind, and finds nothing for an unknown one', () => {
    expect(sourceByKind('EXPENSE')?.label).toBe('Expense Claim');
    expect(sourceByKind('DEPLOYMENT')).toBeUndefined();
  });

  it('refuses an anonymous caller before reading anything', async () => {
    await expect(decideApproval({ user: null }, 'LEAVE:x', 'APPROVED')).rejects.toThrow(
      'Authentication required',
    );
  });
});
