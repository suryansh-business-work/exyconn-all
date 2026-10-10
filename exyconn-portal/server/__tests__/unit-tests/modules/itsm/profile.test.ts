import { Types } from 'mongoose';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { ItAccessRequestModel } from '../../../../src/modules/itsm/models';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, itQuery as q, person } from './itsm.fixtures';

type Profile = {
  id: string;
  name: string;
  department: string | null;
  designation: string | null;
  roles: string[];
  isActive: boolean;
  isBlocked: boolean;
  lastActiveAt: Date | null;
  assets: unknown[];
  licences: unknown[];
  access: unknown[];
  openRequests: Array<{ application: string; status: string }>;
  openTickets: number;
};

const it1 = ctxFor('it-1', [ROLES.IT]);
const profileOf = (employeeId: string, ctx = it1) =>
  q.itEmployeeProfile(null, { employeeId }, ctx) as Promise<Profile>;

describe('IT employee profile', () => {
  useTestOrganization();

  it('reads an account with nothing on it as empty rather than failing', async () => {
    const asha = await person('Asha Rao');

    const profile = await profileOf(asha);

    expect(profile).toMatchObject({
      id: asha,
      name: 'Asha Rao',
      department: null,
      designation: null,
      roles: [ROLES.EMPLOYEE],
      isBlocked: false,
      lastActiveAt: null,
      assets: [],
      licences: [],
      access: [],
      openRequests: [],
      openTickets: 0,
    });
  });

  it('counts open IT tickets only, and lists requests still in flight newest first', async () => {
    const lastActiveAt = new Date('2026-09-01T10:00:00.000Z');
    const asha = await person('Asha Rao', [ROLES.EMPLOYEE], {
      designation: 'Engineer',
      lastActiveAt,
    });
    const ticket = (category: string, status = 'OPEN') => ({
      employeeId: asha,
      subject: 's',
      description: 'd',
      category,
      status,
    });
    await SupportTicketModel.create([ticket('IT'), ticket('IT', 'RESOLVED'), ticket('HR')]);
    const request = async (application: string, status: string, createdAt: string) => {
      const row = await ItAccessRequestModel.create({
        employeeId: asha,
        application,
        reason: 'r',
        status,
      });
      // Mongoose keeps createdAt immutable, so the back-dating goes through the driver.
      await ItAccessRequestModel.collection.updateOne(
        { _id: row._id },
        { $set: { createdAt: new Date(createdAt) } },
      );
    };
    await request('Slack', 'PENDING', '2026-09-01T00:00:00.000Z');
    await request('Jira', 'APPROVED', '2026-09-02T00:00:00.000Z');
    await request('Zoom', 'REJECTED', '2026-09-03T00:00:00.000Z');

    const profile = await profileOf(asha);

    expect(profile).toMatchObject({ designation: 'Engineer', lastActiveAt });
    expect(profile.openTickets).toBe(1);
    expect(profile.openRequests.map((row) => row.application)).toEqual(['Jira', 'Slack']);
  });

  it('reads an account written before roles and blocking existed as no roles, not blocked', async () => {
    const asha = await person('Asha Rao');
    await UserModel.collection.updateOne(
      { _id: new Types.ObjectId(asha) },
      { $unset: { roles: '', isBlocked: '' } },
    );

    const profile = await profileOf(asha);

    expect(profile).toMatchObject({ id: asha, roles: [], isBlocked: false });
  });

  it('refuses an id that is not one, and one that names nobody', async () => {
    expect(await codeOf(profileOf('nope'))).toBe('NOT_FOUND');
    expect(await codeOf(profileOf(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });

  it('keeps everyone outside IT out', async () => {
    const asha = await person('Asha Rao');

    expect(await codeOf(profileOf(asha, ctxFor(asha, [ROLES.EMPLOYEE])))).toBe('FORBIDDEN');
  });
});
