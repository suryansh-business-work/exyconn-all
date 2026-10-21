import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { legalResolvers, policiesService } from '../../../../src/modules/legal';
import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { LegalAssignmentModel } from '../../../../src/modules/legal/legal-assignment.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedUser, useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const L = { ...legalResolvers.Query, ...legalResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const PASSWORD = `pw-${randomUUID()}`;
const ctxOf = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, roles, email: `${id}@exyconn.com` },
});
const legal = () => ctxOf(new Types.ObjectId().toHexString(), [ROLES.LEGAL]);
const hr = () => ctxOf(new Types.ObjectId().toHexString(), [ROLES.HR]);

interface Group {
  id: string;
  name: string;
}
interface Assignment {
  id: string;
  kind: string;
  itemId: string;
  title: string;
  groupName: string | null;
  hasBody: boolean;
  fileUrl: string;
}

useTestOrganization();

async function group(name: string, kind = 'CONTRACT'): Promise<Group> {
  return (await L.createLegalGroup(null, { input: { name, kind } }, legal())) as Group;
}

async function contract(title: string, groupId: string | null = null, status = 'ACTIVE') {
  return (await L.createContract(
    null,
    {
      input: {
        title,
        party: 'Asha Rao',
        type: 'EMPLOYMENT',
        effectiveDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-01-01'),
        status,
        content: '<p>Terms</p>',
        groupId,
      },
    },
    legal(),
  )) as { id: string };
}

async function employee() {
  return seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.EMPLOYEE]);
}

describe('legal groups', () => {
  it('files a contract under a group of its kind, and refuses one of another kind', async () => {
    const partTime = await group('Part Time Employee Contracts');
    const itPolicies = await group('IT policies', 'POLICY');

    await contract('Part-time offer', partTime.id);

    expect(await ContractModel.countDocuments({ groupId: partTime.id })).toBe(1);
    expect(await codeOf(contract('Mismatched', itPolicies.id))).toBe('BAD_USER_INPUT');
  });

  it('keeps a group to the kind it was created with', async () => {
    const partTime = await group('Part Time Employee Contracts');

    expect(
      await codeOf(
        L.updateLegalGroup(
          null,
          { id: partTime.id, input: { name: 'Renamed', kind: 'POLICY' } },
          legal(),
        ),
      ),
    ).toBe('BAD_USER_INPUT');
  });

  it('ungroups the members when a group is deleted', async () => {
    const partTime = await group('Part Time Employee Contracts');
    const offer = await contract('Part-time offer', partTime.id);

    await L.deleteLegalGroup(null, { id: partTime.id }, legal());

    expect((await ContractModel.findById(offer.id).lean())?.groupId).toBeNull();
  });

  it('checks the group on a policy too', async () => {
    const contracts = await group('Contracts only');

    await expect(
      policiesService.create({
        title: 'Code of conduct',
        slug: `conduct-${randomUUID()}`,
        body: '<p>Be kind</p>',
        audience: 'ALL_STAFF',
        effectiveDate: new Date('2026-01-01'),
        groupId: contracts.id,
      }),
    ).rejects.toThrow('Choose a group from the list for this kind of item');
  });

  it('keeps groups to Legal', async () => {
    expect(await codeOf(L.listLegalGroups(null, {}, hr()))).toBe('FORBIDDEN');
  });
});

describe('handing legal items to employees', () => {
  it('lists what can be handed over with its group, leaving retired items out', async () => {
    const partTime = await group('Part Time Employee Contracts');
    await contract('Part-time offer', partTime.id);
    await contract('Old deal', null, 'TERMINATED');

    const rows = (await L.legalAssignables(null, {}, hr())) as Array<{
      title: string;
      groupName: string | null;
    }>;

    expect(rows).toEqual([
      expect.objectContaining({
        title: 'Part-time offer',
        groupName: 'Part Time Employee Contracts',
      }),
    ]);
  });

  it('assigns once however often it is asked, and the employee reads it on their profile', async () => {
    const person = await employee();
    const partTime = await group('Part Time Employee Contracts');
    const offer = await contract('Part-time offer', partTime.id);
    const items = [{ kind: 'CONTRACT', itemId: offer.id }];

    await L.assignLegalItems(null, { userId: person.id, items: [...items, ...items] }, hr());
    const again = (await L.assignLegalItems(
      null,
      { userId: person.id, items },
      hr(),
    )) as Assignment[];

    expect(again).toHaveLength(1);
    const mine = (await L.myLegalAssignments(
      null,
      {},
      ctxOf(person.id, [ROLES.EMPLOYEE]),
    )) as Assignment[];
    expect(mine).toEqual([
      expect.objectContaining({
        title: 'Part-time offer',
        groupName: 'Part Time Employee Contracts',
        hasBody: true,
        fileUrl: '',
      }),
    ]);
    await expect(
      L.myLegalAssignmentBody(null, { id: mine[0].id }, ctxOf(person.id, [ROLES.EMPLOYEE])),
    ).resolves.toBe('<p>Terms</p>');
  });

  it('keeps one person from reading what was handed to another', async () => {
    const person = await employee();
    const offer = await contract('Part-time offer');
    const [held] = (await L.assignLegalItems(
      null,
      { userId: person.id, items: [{ kind: 'CONTRACT', itemId: offer.id }] },
      hr(),
    )) as Assignment[];

    expect(
      await codeOf(
        L.myLegalAssignmentBody(
          null,
          { id: held.id },
          ctxOf(new Types.ObjectId().toHexString(), [ROLES.EMPLOYEE]),
        ),
      ),
    ).toBe('NOT_FOUND');
  });

  it('refuses a retired or unknown item, and an unknown person', async () => {
    const person = await employee();
    const old = await contract('Old deal', null, 'TERMINATED');

    expect(
      await codeOf(
        L.assignLegalItems(
          null,
          { userId: person.id, items: [{ kind: 'CONTRACT', itemId: old.id }] },
          hr(),
        ),
      ),
    ).toBe('BAD_USER_INPUT');
    expect(
      await codeOf(
        L.assignLegalItems(
          null,
          {
            userId: new Types.ObjectId().toHexString(),
            items: [{ kind: 'CONTRACT', itemId: old.id }],
          },
          hr(),
        ),
      ),
    ).toBe('NOT_FOUND');
    expect(await codeOf(L.assignLegalItems(null, { userId: person.id, items: [] }, hr()))).toBe(
      'BAD_USER_INPUT',
    );
  });

  it('takes an item back, and drops assignments when the item is deleted', async () => {
    const person = await employee();
    const offer = await contract('Part-time offer');
    const nda = await contract('NDA');
    const held = (await L.assignLegalItems(
      null,
      {
        userId: person.id,
        items: [
          { kind: 'CONTRACT', itemId: offer.id },
          { kind: 'CONTRACT', itemId: nda.id },
        ],
      },
      hr(),
    )) as Assignment[];
    const offerRow = held.find((row) => row.itemId === offer.id);

    await L.unassignLegalItem(null, { id: offerRow?.id }, hr());
    await L.deleteContract(null, { id: nda.id }, legal());

    expect(await LegalAssignmentModel.countDocuments({ userId: person.id })).toBe(0);
  });

  it('keeps assigning to HR and Legal', async () => {
    const employeeCtx = ctxOf(new Types.ObjectId().toHexString(), [ROLES.EMPLOYEE]);

    // These guards throw before any promise exists, so the call itself is what refuses.
    expect(() => L.legalAssignables(null, {}, employeeCtx)).toThrow(
      'You do not have access to this resource',
    );
    expect(() => L.employeeLegalAssignments(null, { userId: 'x' }, employeeCtx)).toThrow(
      'You do not have access to this resource',
    );
  });
});
