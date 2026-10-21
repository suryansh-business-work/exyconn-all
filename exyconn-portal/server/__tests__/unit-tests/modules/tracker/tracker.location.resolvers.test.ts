import { Types } from 'mongoose';
import { trackerLocationResolvers } from '../../../../src/modules/tracker/tracker.location.resolvers';
import { trackerResolvers } from '../../../../src/modules/tracker';
import { trackerEarningsService } from '../../../../src/modules/tracker/tracker.earnings.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerLocationModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { freezeClock } from '../../../helpers';
import { officeFix } from '../../../fixtures/location';
import { codeOf } from '../codeOf';

const { Query, Mutation } = trackerLocationResolvers;
const DATE = '2026-01-05';
const DAY = new Date(`${DATE}T00:00:00Z`);

const ctxAs = (id: string, roles: Role[], deviceId?: string): GraphQLContext =>
  ({ user: { id, email: `${id}@exyconn.com`, roles, deviceId } }) as unknown as GraphQLContext;

async function person(managerId: string | null = null) {
  const user = await UserModel.create({
    name: 'Asha',
    email: `${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
    managerId,
  });
  return user._id.toHexString();
}

const pin = (userId: string) =>
  TrackerLocationModel.create({ ...officeFix, userId, day: DAY, kind: 'ATTENDANCE' });

describe('reading pins', () => {
  it('serves the caller their own pins with ids', async () => {
    const me = await person();
    await pin(me);
    await pin(await person());

    const pins = await Query.myTrackerLocations(null, { date: DATE }, ctxAs(me, [ROLES.EMPLOYEE]));

    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ id: expect.any(String), userId: me, kind: 'ATTENDANCE' });
  });

  it('refuses a caller who is not signed in', async () => {
    await expect(
      codeOf(Query.myTrackerLocations(null, { date: DATE }, { user: null } as GraphQLContext)),
    ).resolves.toBe('UNAUTHENTICATED');
  });

  it('lets HR and the employee’s manager read their pins, and nobody else', async () => {
    const manager = await person();
    const employee = await person(manager);
    await pin(employee);
    const read = (ctx: GraphQLContext) =>
      Query.employeeLocations(null, { employeeId: employee, date: DATE }, ctx);

    await expect(read(ctxAs(new Types.ObjectId().toHexString(), [ROLES.HR]))).resolves.toHaveLength(
      1,
    );
    await expect(read(ctxAs(manager, [ROLES.EMPLOYEE]))).resolves.toHaveLength(1);
    await expect(codeOf(read(ctxAs(await person(), [ROLES.EMPLOYEE])))).resolves.toBe('FORBIDDEN');
  });
});

describe('reading pins over a range', () => {
  const RANGE = { from: DATE, to: '2026-01-07' };

  it('serves the caller only their own pins across the days', async () => {
    const me = await person();
    await pin(me);
    await TrackerLocationModel.create({
      ...officeFix,
      userId: me,
      day: new Date('2026-01-07T00:00:00Z'),
      kind: 'MOVE',
    });
    await pin(await person());

    const pins = await Query.myTrackerLocationsBetween(null, RANGE, ctxAs(me, [ROLES.EMPLOYEE]));

    expect(pins.map((p) => p.kind)).toEqual(['ATTENDANCE', 'MOVE']);
    expect(pins[0]).toMatchObject({ id: expect.any(String), userId: me });
    await expect(
      codeOf(Query.myTrackerLocationsBetween(null, RANGE, { user: null } as GraphQLContext)),
    ).resolves.toBe('UNAUTHENTICATED');
  });

  it('passes the range checks on as a bad request', async () => {
    const me = await person();

    await expect(
      codeOf(
        Query.myTrackerLocationsBetween(
          null,
          { from: '2026-01-07', to: DATE },
          ctxAs(me, [ROLES.EMPLOYEE]),
        ),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
  });

  it('lets HR and the employee’s manager read a range, and nobody else', async () => {
    const manager = await person();
    const employee = await person(manager);
    await pin(employee);
    const read = (ctx: GraphQLContext) =>
      Query.employeeLocationsBetween(null, { employeeId: employee, ...RANGE }, ctx);

    await expect(read(ctxAs(new Types.ObjectId().toHexString(), [ROLES.HR]))).resolves.toHaveLength(
      1,
    );
    await expect(read(ctxAs(manager, [ROLES.EMPLOYEE]))).resolves.toHaveLength(1);
    await expect(codeOf(read(ctxAs(await person(), [ROLES.EMPLOYEE])))).resolves.toBe('FORBIDDEN');
  });
});

describe('reading earnings', () => {
  const earnings = jest.spyOn(trackerEarningsService, 'earnings');
  const figure = { payType: 'HOURLY' as const, rate: 10, currency: 'USD', trackedMs: 0, amount: 0 };
  beforeEach(() => earnings.mockResolvedValue(figure));
  afterAll(() => earnings.mockRestore());

  it('prices the caller’s own time, never an id they pass', async () => {
    const me = await person();
    await expect(
      Query.myTrackerEarnings(null, { from: 'a', to: 'b' }, ctxAs(me, [ROLES.EMPLOYEE])),
    ).resolves.toBe(figure);
    expect(earnings).toHaveBeenCalledWith(me, 'a', 'b');
  });

  it('lets HR read anybody’s earnings and refuses an employee', async () => {
    const employee = await person();
    const args = { employeeId: employee, from: 'a', to: 'b' };

    await expect(
      Query.employeeEarnings(null, args, ctxAs(new Types.ObjectId().toHexString(), [ROLES.HR])),
    ).resolves.toBe(figure);
    await expect(
      codeOf(Query.employeeEarnings(null, args, ctxAs(await person(), [ROLES.EMPLOYEE]))),
    ).resolves.toBe('FORBIDDEN');
    expect(earnings).toHaveBeenCalledTimes(1);
  });
});

describe('trackerRecordLocation', () => {
  const DEVICE = 'phone-1';
  afterEach(() => jest.useRealTimers());

  async function trackingEmployee(timezone = 'Asia/Kolkata') {
    const userId = await person();
    await TrackerAccessModel.create({ userId, grantedBy: 'admin', timezone });
    await TrackerDeviceModel.create({ userId, deviceId: DEVICE, tokenHash: 'h', platform: 'ios' });
    await TrackerSessionModel.create({ userId, deviceId: DEVICE, startedAt: new Date() });
    return userId;
  }

  it('pins a move on the device owner’s local day', async () => {
    const userId = await trackingEmployee();
    // Already 6 January in Kolkata.
    freezeClock('2026-01-05T20:00:00Z');

    await expect(
      Mutation.trackerRecordLocation(
        null,
        { location: officeFix },
        ctxAs(userId, [ROLES.EMPLOYEE], DEVICE),
      ),
    ).resolves.toBe(true);
    await expect(TrackerLocationModel.findOne().lean()).resolves.toMatchObject({
      userId,
      kind: 'MOVE',
      day: new Date('2026-01-06T00:00:00Z'),
    });
  });

  it('refuses a caller without a device token', async () => {
    const userId = await trackingEmployee();
    await expect(
      codeOf(
        Mutation.trackerRecordLocation(
          null,
          { location: officeFix },
          ctxAs(userId, [ROLES.EMPLOYEE]),
        ),
      ),
    ).resolves.toBe('UNAUTHENTICATED');
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
  });

  it('refuses once tracker access is revoked', async () => {
    const userId = await trackingEmployee();
    await TrackerAccessModel.updateOne({ userId }, { isActive: false });
    await expect(
      codeOf(
        Mutation.trackerRecordLocation(
          null,
          { location: officeFix },
          ctxAs(userId, [ROLES.EMPLOYEE], DEVICE),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
  });
});

describe('the tracker module’s resolver map', () => {
  it('serves the location and earnings fields beside the core ones', () => {
    expect(trackerResolvers.Query.myTrackerLocations).toBe(Query.myTrackerLocations);
    expect(trackerResolvers.Query.myTrackerLocationsBetween).toBe(Query.myTrackerLocationsBetween);
    expect(trackerResolvers.Query.employeeLocationsBetween).toBe(Query.employeeLocationsBetween);
    expect(trackerResolvers.Query.employeeEarnings).toBe(Query.employeeEarnings);
    expect(trackerResolvers.Mutation.trackerRecordLocation).toBe(Mutation.trackerRecordLocation);
    expect(trackerResolvers.Mutation.trackerMarkAttendance).toEqual(expect.any(Function));
  });
});
