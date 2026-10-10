import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { TrackerManualEntryModel } from '../../src/modules/tracker/models';
import { ApprovalDelegateModel } from '../../src/modules/approvals/delegate.model';
import { myDelegations } from '../../src/modules/approvals/delegates.service';
import { decideApproval } from '../../src/modules/approvals/approvals.service';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

useTestOrganization();

const DAY = 86_400_000;

async function person(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });
  return user._id.toHexString();
}

describe('deciding without any role on the token', () => {
  it('is refused rather than treated as somebody who may decide', async () => {
    const worker = await person('Wes');
    const entry = await TrackerManualEntryModel.create({
      userId: worker,
      startedAt: new Date('2026-03-01T00:00:00.000Z'),
      endedAt: new Date('2026-03-01T01:30:00.000Z'),
      durationMs: 90 * 60_000,
      note: 'Workshop',
      status: 'PENDING',
    });
    const roleless = { user: { id: new Types.ObjectId().toHexString(), email: 'x@exyconn.com' } };

    await expect(
      decideApproval(
        roleless as unknown as GraphQLContext,
        `MANUAL_TIME:${entry._id.toHexString()}`,
        'APPROVED',
      ),
    ).rejects.toThrow('You may not decide');

    const after = await TrackerManualEntryModel.findById(entry._id).lean();
    expect(after?.status).toBe('PENDING');
  });
});

describe('a delegation whose delegate has since been removed', () => {
  it('still lists, with the delegate unnamed', async () => {
    const manager = await person('Asha');
    await ApprovalDelegateModel.create({
      fromEmployeeId: manager,
      toEmployeeId: new Types.ObjectId().toHexString(),
      fromDate: new Date(Date.now() - DAY),
      toDate: new Date(Date.now() + DAY),
    });

    const { given } = await myDelegations(manager);

    expect(given).toHaveLength(1);
    expect(given[0]).toMatchObject({ fromName: 'Asha', toName: '', active: true });
  });
});
