import {
  delegateApprovals,
  delegatedFromIds,
  endDelegation,
  myDelegations,
  reportsInScope,
} from '../../src/modules/approvals/delegates.service';
import { ApprovalDelegateModel } from '../../src/modules/approvals/delegate.model';
import { myApprovals } from '../../src/modules/approvals/approvals.service';
import { assertMayActFor } from '../../src/modules/admin/reporting';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const DAY = 86_400_000;

async function person(name: string, managerId?: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    isActive: true,
    managerId: managerId ?? null,
  });
  return String(user._id);
}

const asEmployee = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.EMPLOYEE], email: 'somebody@exyconn.com' },
});

const leaveFor = (employeeId: string) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'CASUAL',
    fromDate: new Date(),
    toDate: new Date(),
    reason: 'A day off',
    status: 'PENDING',
  });

/**
 * A manager on two weeks' leave used to be a two-week hold on every request behind them, and
 * the workaround people actually reach for is sharing a password.
 */
describe('covering somebody else s approvals', () => {
  useTestOrganization();

  it('puts their reports in the stand-in s queue while the window is open', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const report = await person('Nikhil Roy', manager);
    await leaveFor(report);

    const before = await myApprovals(asEmployee(standIn));
    expect(before.totalCount).toBe(0);

    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() - DAY),
      toDate: new Date(Date.now() + DAY),
      note: 'On leave',
    });

    const after = await myApprovals(asEmployee(standIn));
    expect(after.totalCount).toBe(1);
    expect(after.items[0].requestedByName).toBe('Nikhil Roy');
  });

  it('leaves the manager s own queue alone', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const report = await person('Nikhil Roy', manager);
    await leaveFor(report);
    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() - DAY),
      toDate: new Date(Date.now() + DAY),
    });

    expect((await myApprovals(asEmployee(manager))).totalCount).toBe(1);
  });

  it('closes on its own when the window passes', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() - 10 * DAY),
      toDate: new Date(Date.now() - 2 * DAY),
    });

    expect(await delegatedFromIds(standIn)).toEqual([]);
  });

  it('has not started before its first day', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() + 2 * DAY),
      toDate: new Date(Date.now() + 9 * DAY),
    });

    expect(await delegatedFromIds(standIn)).toEqual([]);
  });

  it('covers a window given as whole days, including the last one', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const today = new Date();

    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: today,
      toDate: today,
    });

    // Saved at any hour, a delegation "for today" has to cover the rest of today.
    expect(await delegatedFromIds(standIn)).toEqual([manager]);
  });

  it('lets the stand-in actually decide, not just look', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const report = await person('Nikhil Roy', manager);

    await expect(assertMayActFor(asEmployee(standIn), report, [ROLES.HR])).rejects.toThrow();

    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() - DAY),
      toDate: new Date(Date.now() + DAY),
    });

    await expect(assertMayActFor(asEmployee(standIn), report, [ROLES.HR])).resolves.toMatchObject({
      id: standIn,
    });
  });

  it('refuses to delegate to yourself, or to a dead account', async () => {
    const manager = await person('Asha Rao');
    const gone = await UserModel.create({
      name: 'Gone Away',
      email: 'gone@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.EMPLOYEE],
      isActive: false,
    });
    const window = { fromDate: new Date(), toDate: new Date() };

    await expect(
      delegateApprovals({ fromEmployeeId: manager, toEmployeeId: manager, ...window }),
    ).rejects.toThrow('somebody else');
    await expect(
      delegateApprovals({
        fromEmployeeId: manager,
        toEmployeeId: String(gone._id),
        ...window,
      }),
    ).rejects.toThrow('active account');
  });

  it('refuses a window that ends before it starts', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');

    await expect(
      delegateApprovals({
        fromEmployeeId: manager,
        toEmployeeId: standIn,
        fromDate: new Date(Date.now() + 5 * DAY),
        toDate: new Date(),
      }),
    ).rejects.toThrow('cannot be before');
  });

  it('shows each side what they arranged and what they hold', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(),
      toDate: new Date(Date.now() + DAY),
    });

    const theirs = await myDelegations(manager);
    const cover = await myDelegations(standIn);

    expect(theirs.given[0]).toMatchObject({ toName: 'Dev Shah', active: true });
    expect(theirs.held).toEqual([]);
    expect(cover.held[0]).toMatchObject({ fromName: 'Asha Rao', active: true });
  });

  it('is only callable off by whoever arranged it', async () => {
    const manager = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const delegation = await delegateApprovals({
      fromEmployeeId: manager,
      toEmployeeId: standIn,
      fromDate: new Date(),
      toDate: new Date(Date.now() + DAY),
    });

    await expect(endDelegation(delegation.id, standIn)).rejects.toThrow();
    expect(await endDelegation(delegation.id, manager)).toBe(true);
    expect(await ApprovalDelegateModel.countDocuments()).toBe(0);
  });

  it('adds up reports across everybody being covered, without repeats', async () => {
    const first = await person('Asha Rao');
    const second = await person('Meera Iyer');
    const standIn = await person('Dev Shah');
    const shared = await person('Nikhil Roy', first);
    const other = await person('Sam Khan', second);
    const own = await person('Priya Nair', standIn);
    const window = { fromDate: new Date(Date.now() - DAY), toDate: new Date(Date.now() + DAY) };
    await delegateApprovals({ fromEmployeeId: first, toEmployeeId: standIn, ...window });
    await delegateApprovals({ fromEmployeeId: second, toEmployeeId: standIn, ...window });

    const scope = await reportsInScope(standIn);

    const sorted = (ids: string[]) => [...ids].sort((a, b) => a.localeCompare(b));
    expect(sorted(scope)).toEqual(sorted([own, shared, other]));
  });
});
