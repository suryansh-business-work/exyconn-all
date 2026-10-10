import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { ExitRecordModel } from '../../../../src/modules/exit/exit.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { exitResolvers } from '../../../../src/modules/exit';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const update = exitResolvers.Mutation.updateExitRecord as unknown as Resolver;

const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@exyconn.com`, roles },
});
const hr = as('hr-1', [ROLES.HR]);
const admin = as('admin-1', [ROLES.ADMIN]);

const person = (email: string, roles: Role[]) => seedUser(email, randomUUID(), roles);

const inputFor = (employeeId: string, stage: string, reason = 'Relocating') => ({
  employeeId,
  resignationDate: new Date('2026-01-05'),
  lastWorkingDate: new Date('2026-02-05'),
  noticePeriodDays: 30,
  reason,
  stage,
  assetsReturned: true,
  knowledgeTransferDone: true,
  exitInterviewNotes: '',
  finalSettlementAmount: null,
  documentsIssued: true,
});

const openExit = (employeeId: string, stage: string) =>
  ExitRecordModel.create(inputFor(employeeId, stage));

const accountOf = (id: string) => UserModel.findById(id).lean();

describe('updateExitRecord offboarding an administrator', () => {
  it('refuses HR switching off an administrator and leaves the record untouched', async () => {
    const boss = await person('boss@exyconn.com', [ROLES.ADMIN]);
    const id = boss._id.toHexString();
    const record = await openExit(id, 'CLEARANCE');

    await expect(
      update(null, { id: record._id.toHexString(), input: inputFor(id, 'EXITED') }, hr),
    ).rejects.toThrow('Only an administrator can offboard an administrator.');

    expect((await accountOf(id))?.isActive).toBe(true);
    expect((await ExitRecordModel.findById(record._id).lean())?.stage).toBe('CLEARANCE');
  });

  it('lets an administrator offboard another administrator', async () => {
    const boss = await person('boss@exyconn.com', [ROLES.ADMIN]);
    const id = boss._id.toHexString();
    const record = await openExit(id, 'FULL_AND_FINAL');

    const updated = (await update(
      null,
      { id: record._id.toHexString(), input: inputFor(id, 'EXITED') },
      admin,
    )) as { stage: string };

    expect(updated.stage).toBe('EXITED');
    const after = await accountOf(id);
    expect(after?.isActive).toBe(false);
    expect(after?.employmentStatus).toBe('TERMINATED');
  });
});

describe('updateExitRecord choosing whom to switch off', () => {
  it('deactivates the person the stored record is about, not the id sent with the edit', async () => {
    const leaver = await person('leaver@exyconn.com', [ROLES.EMPLOYEE]);
    const bystander = await person('bystander@exyconn.com', [ROLES.EMPLOYEE]);
    const leaverId = leaver._id.toHexString();
    const record = await openExit(leaverId, 'CLEARANCE');

    await update(
      null,
      { id: record._id.toHexString(), input: inputFor(bystander._id.toHexString(), 'EXITED') },
      hr,
    );

    expect((await accountOf(leaverId))?.isActive).toBe(false);
    expect((await accountOf(bystander._id.toHexString()))?.isActive).toBe(true);
  });

  it('does not switch the account off again when an already exited record is edited', async () => {
    const leaver = await person('rehired@exyconn.com', [ROLES.EMPLOYEE]);
    const id = leaver._id.toHexString();
    const record = await openExit(id, 'EXITED');

    const updated = (await update(
      null,
      { id: record._id.toHexString(), input: inputFor(id, 'EXITED', 'Notes corrected') },
      hr,
    )) as { reason: string };

    expect(updated.reason).toBe('Notes corrected');
    const after = await accountOf(id);
    expect(after?.isActive).toBe(true);
    expect(after?.employmentStatus).toBe('ACTIVE');
  });

  it('completes the exit when the employee id is not an account id', async () => {
    const record = await openExit('legacy-emp-00042', 'CLEARANCE');

    const updated = (await update(
      null,
      { id: record._id.toHexString(), input: inputFor('legacy-emp-00042', 'EXITED') },
      hr,
    )) as { stage: string };

    expect(updated.stage).toBe('EXITED');
  });

  it('completes the exit when the account it names no longer exists', async () => {
    const goneId = new Types.ObjectId().toHexString();
    const record = await openExit(goneId, 'CLEARANCE');

    const updated = (await update(
      null,
      { id: record._id.toHexString(), input: inputFor(goneId, 'EXITED') },
      hr,
    )) as { stage: string };

    expect(updated.stage).toBe('EXITED');
    expect(await UserModel.countDocuments({ _id: goneId })).toBe(0);
  });

  it('reports a missing record instead of deactivating anybody', async () => {
    const leaver = await person('leaver@exyconn.com', [ROLES.EMPLOYEE]);
    const id = leaver._id.toHexString();
    const missing = new Types.ObjectId().toHexString();

    await expect(update(null, { id: missing, input: inputFor(id, 'EXITED') }, hr)).rejects.toThrow(
      'ExitRecord not found',
    );
    expect((await accountOf(id))?.isActive).toBe(true);
  });

  it('asks for authentication before anything else', async () => {
    const record = await openExit('emp-1', 'CLEARANCE');

    await expect(
      update(
        null,
        { id: record._id.toHexString(), input: inputFor('emp-1', 'EXITED') },
        { user: null },
      ),
    ).rejects.toThrow('Authentication required');
  });
});
