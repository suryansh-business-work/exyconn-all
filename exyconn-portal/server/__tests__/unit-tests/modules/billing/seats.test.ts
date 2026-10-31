import { runForOrganization } from '../../../../src/lib/tenant';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { invalidatePlanAccess } from '../../../../src/modules/billing/access';
import {
  assertSeatAvailable,
  confirmSeatOrUndo,
  seatsUsed,
} from '../../../../src/modules/billing/seats';
import type { Role } from '../../../../src/constants/roles';
import { newOrganizationId, seedPlan, seedSubscription } from './fixtures';

const organizationId = newOrganizationId();
const SEAT_REFUSAL = 'Your plan seats 2 active people and every seat is taken.';

let counter = 0;
/** One person in a company; only their activity and roles matter to seats. */
function seedPerson(company: string, isActive = true, roles: Role[] = ['EMPLOYEE']) {
  counter += 1;
  return runForOrganization(company, () =>
    UserModel.create({
      name: `Person ${counter}`,
      email: `person${counter}@acme.test`,
      passwordHash: 'hash',
      roles,
      isActive,
    }),
  );
}

const inCompany = <T>(fn: () => Promise<T>) => runForOrganization(organizationId, fn);

beforeEach(async () => {
  invalidatePlanAccess();
  await seedSubscription(organizationId, await seedPlan({ seatLimit: 2 }), { status: 'ACTIVE' });
});

describe('seatsUsed', () => {
  it('counts the company’s active people, never a platform administrator or another company', async () => {
    await seedPerson(organizationId);
    await seedPerson(organizationId, false);
    await seedPerson(organizationId, true, ['SUPER_ADMIN']);
    await seedPerson(newOrganizationId());

    expect(await inCompany(seatsUsed)).toBe(1);
  });
});

describe('assertSeatAvailable', () => {
  it('lets the last free seat be taken', async () => {
    await seedPerson(organizationId);

    await expect(inCompany(assertSeatAvailable)).resolves.toBeUndefined();
  });

  it('refuses once every seat is taken', async () => {
    await seedPerson(organizationId);
    await seedPerson(organizationId);

    await expect(inCompany(assertSeatAvailable)).rejects.toThrow(SEAT_REFUSAL);
  });

  it('never refuses on an unlimited plan', async () => {
    const unlimited = newOrganizationId();
    await seedSubscription(unlimited, await seedPlan({ key: 'open', seatLimit: 0 }));
    await seedPerson(unlimited);
    await seedPerson(unlimited);
    await seedPerson(unlimited);

    await expect(runForOrganization(unlimited, assertSeatAvailable)).resolves.toBeUndefined();
  });
});

describe('confirmSeatOrUndo', () => {
  it('keeps a person who filled the last seat', async () => {
    await seedPerson(organizationId);
    await seedPerson(organizationId);
    const undo = jest.fn();

    await inCompany(() => confirmSeatOrUndo(undo));

    expect(undo).not.toHaveBeenCalled();
  });

  it('undoes and refuses the person who went one past the limit (a race)', async () => {
    await seedPerson(organizationId);
    await seedPerson(organizationId);
    const third = await seedPerson(organizationId);
    const undo = () => UserModel.updateOne({ _id: third._id }, { isActive: false });

    await expect(inCompany(() => confirmSeatOrUndo(undo))).rejects.toThrow(SEAT_REFUSAL);
    expect(await inCompany(seatsUsed)).toBe(2);
  });

  it('never undoes on an unlimited plan', async () => {
    const unlimited = newOrganizationId();
    await seedSubscription(unlimited, await seedPlan({ key: 'open', seatLimit: 0 }));
    await seedPerson(unlimited);
    const undo = jest.fn();

    await runForOrganization(unlimited, () => confirmSeatOrUndo(undo));

    expect(undo).not.toHaveBeenCalled();
  });
});
