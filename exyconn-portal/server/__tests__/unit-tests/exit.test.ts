import { ExitRecordModel } from '../../src/modules/exit/exit.model';
import { exitResolvers } from '../../src/modules/exit';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = exitResolvers.Query as unknown as Record<string, Resolver>;
const ctx = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const daysLeft = exitResolvers.ExitRecord.daysToLastWorkingDay;
const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

describe('daysToLastWorkingDay', () => {
  it('counts whole days ahead', () => {
    expect(daysLeft({ lastWorkingDate: inDays(30) })).toBe(30);
  });

  it('is zero on the last working day itself', () => {
    expect(daysLeft({ lastWorkingDate: new Date() })).toBe(0);
  });

  it('is null once the date has passed, rather than going negative', () => {
    expect(daysLeft({ lastWorkingDate: inDays(-5) })).toBeNull();
  });

  it('is null when no last working day has been agreed yet', () => {
    expect(daysLeft({ lastWorkingDate: null })).toBeNull();
  });

  it('accepts the stored value as a string, which is how lean reads it back', () => {
    expect(daysLeft({ lastWorkingDate: inDays(10).toISOString() })).toBe(10);
  });
});

describe('myExitRecord', () => {
  it('returns null when the employee has no exit in progress', async () => {
    await expect(Q.myExitRecord(null, {}, ctx('emp-1', [ROLES.EMPLOYEE]))).resolves.toBeNull();
  });

  it('returns the employee’s own record and never somebody else’s', async () => {
    await ExitRecordModel.create({
      employeeId: 'emp-1',
      resignationDate: inDays(-10),
      reason: 'Mine',
    });
    await ExitRecordModel.create({
      employeeId: 'emp-2',
      resignationDate: inDays(-2),
      reason: 'Theirs',
    });

    const mine = (await Q.myExitRecord(null, {}, ctx('emp-1', [ROLES.EMPLOYEE]))) as {
      reason: string;
    };
    expect(mine.reason).toBe('Mine');
  });

  it('picks the most recent when an employee has resigned more than once', async () => {
    await ExitRecordModel.create({
      employeeId: 'emp-1',
      resignationDate: inDays(-100),
      reason: 'Older',
    });
    await ExitRecordModel.create({
      employeeId: 'emp-1',
      resignationDate: inDays(-1),
      reason: 'Latest',
    });

    const mine = (await Q.myExitRecord(null, {}, ctx('emp-1', [ROLES.EMPLOYEE]))) as {
      reason: string;
    };
    expect(mine.reason).toBe('Latest');
  });

  it('keeps the HR-wide list away from a plain employee', async () => {
    await expect(Q.listExitRecords(null, {}, ctx('emp-1', [ROLES.EMPLOYEE]))).rejects.toThrow();
    await expect(Q.listExitRecords(null, {}, ctx('hr-1', [ROLES.HR]))).resolves.toBeDefined();
  });
});
