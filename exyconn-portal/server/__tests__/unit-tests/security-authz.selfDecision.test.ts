import { Types } from 'mongoose';
import { hrResolvers } from '../../src/modules/hr';
import { LeaveRequestModel } from '../../src/modules/hr/hr.model';
import { expensesResolvers } from '../../src/modules/expenses';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { payrollResolvers } from '../../src/modules/payroll';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { exitResolvers } from '../../src/modules/exit';
import { ExitRecordModel } from '../../src/modules/exit/exit.model';
import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { TaskCommentModel } from '../../src/modules/projects/board.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const HR = hrResolvers.Mutation as unknown as Record<string, Resolver>;
const EXPENSES = expensesResolvers.Mutation as unknown as Record<string, Resolver>;
const PAYROLL = payrollResolvers.Mutation as unknown as Record<string, Resolver>;
const EXIT = exitResolvers.Mutation as unknown as Record<string, Resolver>;
const BOARD = boardResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@x.com`, roles },
});

const person = (roles: Role[], name = 'Person') =>
  UserModel.create({
    name,
    email: `${new Types.ObjectId().toHexString()}@x.com`,
    passwordHash: 'hash',
    roles,
  });

const leave = (employeeId: string) =>
  LeaveRequestModel.create({
    employeeId,
    type: 'CASUAL',
    fromDate: new Date(),
    toDate: new Date(),
    reason: 'Rest',
  });

beforeEach(() => invalidatePermissionCache());

describe('M7: nobody decides about themselves', () => {
  it('refuses HR approving its own leave, by decision or through the console', async () => {
    const hr = await person([ROLES.HR]);
    const own = await leave(String(hr._id));
    const ctx = as(String(hr._id), [ROLES.HR]);

    await expect(
      HR.setLeaveStatus(null, { id: String(own._id), status: 'APPROVED' }, ctx),
    ).rejects.toThrow(/for yourself/);
    await expect(
      HR.updateLeaveRequest(
        null,
        { id: String(own._id), input: { employeeId: 'someone-else', status: 'APPROVED' } },
        ctx,
      ),
    ).rejects.toThrow(/for yourself/);
    expect((await LeaveRequestModel.findById(own._id).lean())?.status).toBe('PENDING');
  });

  it('still lets HR decide somebody else’s leave', async () => {
    const hr = await person([ROLES.HR]);
    const other = await leave(new Types.ObjectId().toHexString());
    const decided = (await HR.setLeaveStatus(
      null,
      { id: String(other._id), status: 'REJECTED' },
      as(String(hr._id), [ROLES.HR]),
    )) as { status: string };
    expect(decided.status).toBe('REJECTED');
  });

  it('refuses Finance approving its own expense claim', async () => {
    const claim = await ExpenseClaimModel.create({
      employeeId: 'fin-1',
      category: 'Travel',
      description: 'Taxi',
      amount: 500,
      currency: 'INR',
      incurredOn: new Date(),
    });
    await expect(
      EXPENSES.setExpenseClaimStatus(
        null,
        { id: String(claim._id), status: 'APPROVED' },
        as('fin-1', [ROLES.FINANCE]),
      ),
    ).rejects.toThrow(/for yourself/);
    expect((await ExpenseClaimModel.findById(claim._id).lean())?.status).toBe('SUBMITTED');
  });

  it('refuses anybody setting their own salary', async () => {
    await expect(
      PAYROLL.saveEmployeeSalary(
        null,
        { employeeId: 'hr-1', input: { basic: 1_000_000, effectiveFrom: new Date() } },
        as('hr-1', [ROLES.ADMIN]),
      ),
    ).rejects.toThrow(/for yourself/);
    expect(await SalaryStructureModel.countDocuments()).toBe(0);
  });
});

describe('M2: offboarding', () => {
  const exitArgs = (id: string, employeeId: string) => ({
    id,
    input: {
      employeeId,
      resignationDate: new Date(),
      noticePeriodDays: 30,
      reason: 'Moving on',
      stage: 'EXITED',
      assetsReturned: true,
      knowledgeTransferDone: true,
      exitInterviewNotes: '',
      documentsIssued: true,
    },
  });

  it('deactivates the person the stored record is about, never an id sent with the edit', async () => {
    const hr = await person([ROLES.HR], 'HR');
    const leaver = await person([ROLES.EMPLOYEE], 'Leaver');
    const bystander = await person([ROLES.EMPLOYEE], 'Bystander');
    const record = await ExitRecordModel.create({
      employeeId: String(leaver._id),
      resignationDate: new Date(),
      reason: 'Moving on',
    });

    await EXIT.updateExitRecord(
      null,
      exitArgs(String(record._id), String(bystander._id)),
      as(String(hr._id), [ROLES.HR]),
    );

    expect((await UserModel.findById(leaver._id).lean())?.isActive).toBe(false);
    expect((await UserModel.findById(bystander._id).lean())?.isActive).toBe(true);
  });

  it('refuses a non-ADMIN offboarding an administrator', async () => {
    const hr = await person([ROLES.HR], 'HR');
    const boss = await person([ROLES.ADMIN], 'Boss');
    const record = await ExitRecordModel.create({
      employeeId: String(boss._id),
      resignationDate: new Date(),
      reason: 'x',
    });
    await expect(
      EXIT.updateExitRecord(
        null,
        exitArgs(String(record._id), String(boss._id)),
        as(String(hr._id), [ROLES.HR]),
      ),
    ).rejects.toThrow(/administrator/);
    expect((await UserModel.findById(boss._id).lean())?.isActive).toBe(true);
    expect((await ExitRecordModel.findById(record._id).lean())?.stage).not.toBe('EXITED');
  });
});

describe('L4: deleting a task comment', () => {
  const comment = (authorId: string) =>
    TaskCommentModel.create({
      taskId: new Types.ObjectId(),
      authorId,
      authorName: 'Author',
      body: 'Looks good',
    });

  it('is the author’s or an administrator’s, nobody else’s', async () => {
    const mine = await comment('author-1');
    await expect(
      BOARD.deleteTaskComment(null, { id: String(mine._id) }, as('other', [ROLES.PROJECTS])),
    ).rejects.toThrow(/author or an administrator/);

    await expect(
      BOARD.deleteTaskComment(null, { id: String(mine._id) }, as('author-1', [ROLES.PROJECTS])),
    ).resolves.toBe(true);

    const theirs = await comment('author-2');
    await expect(
      BOARD.deleteTaskComment(null, { id: String(theirs._id) }, as('admin', [ROLES.ADMIN])),
    ).resolves.toBe(true);
  });
});
