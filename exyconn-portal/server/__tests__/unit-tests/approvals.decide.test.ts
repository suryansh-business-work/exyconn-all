import { UserModel } from '../../src/modules/admin/user.model';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { TrackerManualEntryModel } from '../../src/modules/tracker/models';
import { decideApproval, myApprovals } from '../../src/modules/approvals/approvals.service';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const ctx = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@exyconn.com`, roles },
});

const person = async (name: string) => {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });
  return String(user._id);
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const manualFor = (userId: string, projectName?: string) =>
  TrackerManualEntryModel.create({
    userId,
    projectName,
    startedAt: day('2026-03-01'),
    endedAt: new Date(day('2026-03-01').getTime() + 90 * 60_000),
    durationMs: 90 * 60_000,
    note: 'Workshop off site',
    status: 'PENDING',
  });

describe('off-computer time in the queue', () => {
  it('titles an entry by its minutes and project, or says it has none', async () => {
    const tracker = await person('Tara');
    const worker = await person('Wes');
    await manualFor(worker, 'Website');
    await manualFor(worker);

    const queue = await myApprovals(ctx(tracker, [ROLES.TRACKER]), 'MANUAL_TIME');

    expect(queue.items.map((item) => item.title).sort((a, b) => a.localeCompare(b))).toEqual([
      '90 min on no project',
      '90 min on Website',
    ]);
    expect(queue.items[0]).toMatchObject({
      link: '/tracker/approvals',
      summary: 'Workshop off site',
    });
  });

  it('reviews an entry through the tracker service, keeping the note', async () => {
    const tracker = await person('Tara');
    const entry = await manualFor(await person('Wes'));

    await decideApproval(
      ctx(tracker, [ROLES.TRACKER]),
      `MANUAL_TIME:${entry._id}`,
      'REJECTED',
      'No evidence',
    );

    const after = await TrackerManualEntryModel.findById(entry._id).lean();
    expect(after).toMatchObject({
      status: 'REJECTED',
      reviewedBy: tracker,
      reviewNote: 'No evidence',
    });
  });

  it('records an empty note when the decision carries none', async () => {
    const tracker = await person('Tara');
    const entry = await manualFor(await person('Wes'));

    await decideApproval(ctx(tracker, [ROLES.TRACKER]), `MANUAL_TIME:${entry._id}`, 'APPROVED');

    const after = await TrackerManualEntryModel.findById(entry._id).lean();
    expect(after).toMatchObject({ status: 'APPROVED', reviewNote: '' });
  });
});

describe('expense claims through the queue', () => {
  it('lets finance approve a claim for the full amount asked', async () => {
    const finance = await person('Fin');
    const claim = await ExpenseClaimModel.create({
      employeeId: await person('Ravi'),
      category: 'Travel',
      description: 'Client visit',
      amount: 800,
      currency: 'INR',
      incurredOn: day('2026-03-01'),
      status: 'SUBMITTED',
    });

    await expect(
      decideApproval(ctx(finance, [ROLES.FINANCE]), `EXPENSE:${claim._id}`, 'APPROVED'),
    ).resolves.toBe(true);

    const after = await ExpenseClaimModel.findById(claim._id).lean();
    expect(after).toMatchObject({ status: 'APPROVED', approvedAmount: 800 });
  });
});
