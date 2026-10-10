import { Types } from 'mongoose';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ExitRecordModel } from '../../../../src/modules/exit/exit.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, itMutation as m, itStaff, person } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const disable = (employeeId: string, ctx: GraphQLContext) =>
  m.itDisableLeaverAccount(null, { employeeId }, ctx);

describe("disabling a leaver's account from IT", () => {
  useTestOrganization();

  it('runs the admin switch and writes the same audit entry', async () => {
    const { ctx } = await itStaff();
    const asha = await person('Asha Rao');
    await ExitRecordModel.create({ employeeId: asha, resignationDate: new Date() });

    const updated = (await disable(asha, ctx)) as { id: string; isActive: boolean };

    expect(updated).toMatchObject({ id: asha, isActive: false });
    expect((await UserModel.findById(asha).lean())?.isActive).toBe(false);
    const entry = await AuditLogModel.findOne({ module: 'User', entityId: asha }).lean();
    expect(entry).toMatchObject({
      action: 'UPDATE',
      entityLabel: 'asha.rao@exyconn.com',
      summary: 'Deactivated leaver Asha Rao from IT offboarding',
      actorName: 'Ira Tech',
    });
  });

  it('refuses an id that is not one, and one that names nobody', async () => {
    const { ctx } = await itStaff();
    const ghost = new Types.ObjectId().toHexString();
    await ExitRecordModel.create({ employeeId: ghost, resignationDate: new Date() });

    expect(await codeOf(disable('nope', ctx))).toBe('NOT_FOUND');
    expect(await codeOf(disable(ghost, ctx))).toBe('NOT_FOUND');
  });

  it('never lets IT disable itself, even when leaving', async () => {
    const { id, ctx } = await itStaff();
    await ExitRecordModel.create({ employeeId: id, resignationDate: new Date() });

    await expect(disable(id, ctx)).rejects.toThrow('You cannot disable your own account');
    expect((await UserModel.findById(id).lean())?.isActive).toBe(true);
  });

  it('refuses people outside IT', async () => {
    const asha = await person('Asha Rao');

    expect(await codeOf(disable(asha, ctxFor(asha, [ROLES.EMPLOYEE])))).toBe('FORBIDDEN');
  });
});
