import { EmployeeRequestModel } from '../../src/modules/requests/request.model';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { NotificationModel } from '../../src/modules/notifications';
import { requestsResolvers } from '../../src/modules/requests';
import { expensesResolvers } from '../../src/modules/expenses';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const updateRequest = requestsResolvers.Mutation.updateEmployeeRequest as unknown as Resolver;
const updateClaim = expensesResolvers.Mutation.updateExpenseClaim as unknown as Resolver;

const as = (roles: string[]) =>
  ({ user: { id: 'staff-1', email: 's@exyconn.com', roles } }) as unknown as GraphQLContext;
const EMP = 'emp-1';

const requestInput = {
  employeeId: EMP,
  type: 'WFH',
  subject: 'WFH Friday',
  details: 'Plumber visit',
  status: 'PENDING',
  decisionNote: null,
};

const claimInput = {
  employeeId: EMP,
  category: 'TRAVEL',
  description: 'Client visit cab',
  amount: 640,
  currency: 'INR',
  incurredOn: new Date('2026-02-10'),
  receiptUrl: null,
  status: 'SUBMITTED',
  approvedAmount: null,
};

describe('employee request decisions', () => {
  it('notifies the employee when HR changes the status, carrying the decision note', async () => {
    const row = await EmployeeRequestModel.create(requestInput);

    await updateRequest(
      null,
      {
        id: String(row._id),
        input: { ...requestInput, status: 'APPROVED', decisionNote: 'Enjoy the day' },
      },
      as([ROLES.HR]),
    );

    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.title).toBe('Request approved: WFH Friday');
    expect(note?.body).toBe('Enjoy the day');
    expect(note?.link).toBe('/me/requests');
  });

  it('stays quiet when HR edits the wording without deciding', async () => {
    const row = await EmployeeRequestModel.create(requestInput);

    await updateRequest(
      null,
      { id: String(row._id), input: { ...requestInput, details: 'Plumber, all day' } },
      as([ROLES.HR]),
    );

    expect(await NotificationModel.countDocuments({ employeeId: EMP })).toBe(0);
  });
});

describe('expense claim decisions', () => {
  it('notifies the claimant when finance decides, quoting the cleared amount', async () => {
    const row = await ExpenseClaimModel.create(claimInput);

    await updateClaim(
      null,
      { id: String(row._id), input: { ...claimInput, status: 'APPROVED', approvedAmount: 600 } },
      as([ROLES.FINANCE]),
    );

    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.title).toBe('Expense claim approved: TRAVEL');
    expect(note?.body).toContain('600');
    expect(note?.link).toBe('/me/expenses');
  });

  it('records the decision even when the notification store is down', async () => {
    const row = await ExpenseClaimModel.create(claimInput);
    const spy = jest.spyOn(NotificationModel, 'create').mockRejectedValueOnce(new Error('down'));

    const updated = (await updateClaim(
      null,
      { id: String(row._id), input: { ...claimInput, status: 'REJECTED' } },
      as([ROLES.FINANCE]),
    )) as { status: string };

    expect(updated.status).toBe('REJECTED');
    spy.mockRestore();
  });
});
