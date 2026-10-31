import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { invalidatePlanAccess } from '../../../../src/modules/billing/access';
import * as seats from '../../../../src/modules/billing/seats';
import { organizationService } from '../../../../src/modules/organizations/organizations.service';
import { useTestOrganization } from '../../../helpers';
import { seedPlan, seedSubscription } from './fixtures';

const organizationId = useTestOrganization();
const FULL = 'Your plan seats 2 active people and every seat is taken.';

let counter = 0;
const nextEmail = () => {
  counter += 1;
  return `person${counter}@acme.test`;
};

const createUser = (isActive?: boolean) =>
  adminService.createUser({ name: 'Person', email: nextEmail(), roles: ['EMPLOYEE'], isActive });
const activeCount = () => UserModel.countDocuments({ isActive: true });

beforeEach(async () => {
  invalidatePlanAccess();
  await seedSubscription(organizationId, await seedPlan({ seatLimit: 2 }), { status: 'ACTIVE' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Lets the up-front check pass as a second administrator's simultaneous check would. */
const raceThePreCheck = () => jest.spyOn(seats, 'assertSeatAvailable').mockResolvedValue();

describe('Admin › Users against the seat limit', () => {
  it('creates people up to the limit and refuses the next', async () => {
    await createUser();
    await createUser();

    await expect(createUser()).rejects.toThrow(FULL);
    expect(await UserModel.countDocuments()).toBe(2);
  });

  it('still adds an inactive person when every seat is taken', async () => {
    await createUser();
    await createUser();

    const { user } = await createUser(false);

    expect(user.isActive).toBe(false);
  });

  it('removes a person created past the limit in a race', async () => {
    await createUser();
    await createUser();
    raceThePreCheck();

    await expect(createUser()).rejects.toThrow(FULL);
    expect(await UserModel.countDocuments()).toBe(2);
  });

  it('refuses switching someone back on when every seat is taken, and allows it when one frees up', async () => {
    const { user: off } = await createUser(false);
    const { user: first } = await createUser();
    await createUser();

    await expect(adminService.setUserActive(String(off._id), true)).rejects.toThrow(FULL);
    await adminService.setUserActive(String(first._id), false);
    const back = await adminService.setUserActive(String(off._id), true);

    expect(back.isActive).toBe(true);
    expect(await activeCount()).toBe(2);
  });

  it('switches someone back off when the reactivation raced past the limit', async () => {
    const { user: off } = await createUser(false);
    await createUser();
    await createUser();
    raceThePreCheck();

    await expect(adminService.setUserActive(String(off._id), true)).rejects.toThrow(FULL);
    expect((await UserModel.findById(off._id).lean())?.isActive).toBe(false);
  });

  it('takes no seat to re-save someone already active, or to switch someone off', async () => {
    const { user: first } = await createUser();
    await createUser();

    await expect(adminService.setUserActive(String(first._id), true)).resolves.toMatchObject({
      isActive: true,
    });
    await expect(
      adminService.updateUser(String(first._id), { isActive: true }),
    ).resolves.toMatchObject({
      isActive: true,
    });
    await expect(adminService.setUserActive(String(first._id), false)).resolves.toMatchObject({
      isActive: false,
    });
  });

  it('applies the same limit when an edit switches someone on', async () => {
    const { user: off } = await createUser(false);
    await createUser();
    await createUser();

    await expect(adminService.updateUser(String(off._id), { isActive: true })).rejects.toThrow(
      FULL,
    );
    raceThePreCheck();
    await expect(adminService.updateUser(String(off._id), { isActive: true })).rejects.toThrow(
      FULL,
    );
    expect((await UserModel.findById(off._id).lean())?.isActive).toBe(false);
  });
});

describe('inviting members against the seat limit', () => {
  const invite = (email: string) =>
    organizationService.addMember(organizationId, { name: 'Invitee', email, roles: ['CRM'] });

  it('refuses an account from no company once every seat is taken', async () => {
    await createUser();
    await createUser();
    const email = nextEmail();
    await runAsPlatform(() =>
      UserModel.create({ name: 'Loose', email, passwordHash: 'hash', roles: ['EMPLOYEE'] }),
    );

    await expect(invite(email)).rejects.toThrow(FULL);
  });

  it('refuses re-inviting an inactive member once every seat is taken', async () => {
    const { user: off } = await createUser(false);
    await createUser();
    await createUser();

    await expect(invite(off.email)).rejects.toThrow(FULL);
  });

  it('adds roles to an active member without taking another seat', async () => {
    const { user: first } = await createUser();
    await createUser();

    const updated = await invite(first.email);

    expect(updated.roles).toEqual(['EMPLOYEE', 'CRM']);
    expect(await runForOrganization(organizationId, activeCount)).toBe(2);
  });
});
