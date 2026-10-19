import { Types } from 'mongoose';
import { CrmViewModel } from '../../../../../src/modules/crm/records/crm-view.model';
import {
  createView,
  deleteView,
  listViews,
  updateView,
  viewObject,
  type CrmViewInput,
} from '../../../../../src/modules/crm/records/crm.views';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { asArg } from '../../../../mockAs';

const ownerId = new Types.ObjectId().toHexString();
const otherId = new Types.ObjectId().toHexString();
const asOwner: GraphQLContext = {
  user: { id: ownerId, roles: [ROLES.CRM], email: 'asha@exyconn.com' },
};
const asOther: GraphQLContext = {
  user: { id: otherId, roles: [ROLES.CRM], email: 'ravi@exyconn.com' },
};
const asAdmin: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.ADMIN], email: 'boss@exyconn.com' },
};
const missingId = () => new Types.ObjectId().toHexString();

const view = (overrides: Partial<CrmViewInput> = {}): CrmViewInput => ({
  object: 'LEAD',
  name: '  Hot leads  ',
  shared: false,
  search: '  acme ',
  groups: [{ conditions: [{ property: 'stage', op: 'IN', values: ['NEW'] }] }],
  sorts: [{ property: 'value', dir: 'DESC' }],
  columns: ['name', 'stage'],
  ...overrides,
});

describe('saving a view', () => {
  it('stores the trimmed view under its owner and shows it as theirs', async () => {
    const saved = await createView(asOwner, view());

    expect(saved).toMatchObject({
      object: 'LEAD',
      name: 'Hot leads',
      search: 'acme',
      shared: false,
      mine: true,
      ownerName: 'asha@exyconn.com',
      columns: ['name', 'stage'],
      sorts: [{ property: 'value', dir: 'DESC' }],
    });
    expect(await CrmViewModel.findById(saved.id).lean()).toMatchObject({ ownerId });
  });

  it.each([
    ['a blank name', { name: '   ' }, 'Give the view a name of 1 to 60 characters'],
    ['a name over 60 characters', { name: 'x'.repeat(61) }, 'Give the view a name of 1 to 60'],
    ['an unknown column', { columns: ['name', 'budget'] }, 'names a column that does not exist'],
    [
      'more than 60 columns',
      { columns: Array.from({ length: 61 }, () => 'name') },
      'names a column that does not exist',
    ],
    [
      'a filter the list would refuse',
      { groups: [{ conditions: [{ property: 'nope', op: 'EQ' as const, values: ['1'] }] }] },
      'There is no property "nope"',
    ],
    [
      'a sort the list would refuse',
      { sorts: [{ property: 'nope', dir: 'ASC' as const }] },
      'There is no property "nope"',
    ],
  ])('refuses %s', async (_why, overrides, message) => {
    await expect(createView(asOwner, view(overrides))).rejects.toThrow(message);
    expect(await CrmViewModel.countDocuments()).toBe(0);
  });

  it('stops at 50 views per person and record type', async () => {
    await CrmViewModel.insertMany(
      Array.from({ length: 50 }, (_, i) => ({ object: 'LEAD', name: `V${i}`, ownerId })),
    );

    await expect(createView(asOwner, view())).rejects.toThrow('You can save up to 50 views here');
    await expect(
      createView(asOwner, view({ object: 'CONTACT', groups: [], sorts: [], columns: ['name'] })),
    ).resolves.toMatchObject({ object: 'CONTACT' });
  });
});

describe('listing views', () => {
  it('lists my views and the shared ones, oldest first', async () => {
    await createView(asOwner, view({ name: 'Mine' }));
    await createView(asOther, view({ name: 'Theirs, shared', shared: true }));
    await createView(asOther, view({ name: 'Theirs, private' }));
    await createView(
      asOther,
      view({
        name: 'Contacts',
        object: 'CONTACT',
        shared: true,
        groups: [],
        sorts: [],
        columns: [],
      }),
    );

    const views = await listViews(asOwner, 'LEAD');

    expect(views.map((v) => [v.name, v.mine])).toEqual([
      ['Mine', true],
      ['Theirs, shared', false],
    ]);
  });

  it('reads a view stored without its optional fields', async () => {
    await CrmViewModel.collection.insertOne({
      object: 'LEAD',
      name: 'Old',
      ownerId,
      shared: false,
      ownerName: null,
    });

    const [old] = await listViews(asOwner, 'LEAD');

    expect(old).toMatchObject({ ownerName: '', search: '', groups: [], sorts: [], columns: [] });
  });

  it('shows only shared views to a caller without a user', async () => {
    await createView(asOwner, view({ name: 'Private' }));
    expect(await listViews(asArg({}), 'LEAD')).toEqual([]);
  });
});

describe('changing and deleting a view', () => {
  it('lets the owner change it, keeping its record type', async () => {
    const saved = await createView(asOwner, view());

    const changed = await updateView(
      asOwner,
      saved.id,
      view({
        object: 'COMPANY',
        name: 'Won leads',
        shared: true,
        groups: [{ conditions: [{ property: 'stage', op: 'IN', values: ['WON'] }] }],
      }),
    );

    expect(changed).toMatchObject({
      id: saved.id,
      object: 'LEAD',
      name: 'Won leads',
      shared: true,
      mine: true,
    });
  });

  it('lets an administrator change or delete anyone view', async () => {
    const saved = await createView(asOwner, view());

    await expect(updateView(asAdmin, saved.id, view({ name: 'Renamed' }))).resolves.toMatchObject({
      name: 'Renamed',
      mine: false,
    });
    await expect(deleteView(asAdmin, saved.id)).resolves.toBe(true);
    expect(await CrmViewModel.countDocuments()).toBe(0);
  });

  it('refuses anyone else', async () => {
    const saved = await createView(asOwner, view({ shared: true }));
    const noRoles = asArg({ user: { id: otherId, email: 'x@exyconn.com' } });

    for (const ctx of [asOther, noRoles, asArg({})]) {
      await expect(deleteView(ctx, saved.id)).rejects.toThrow(
        'Only the person who saved this view can change it',
      );
    }
    await expect(updateView(asOther, saved.id, view())).rejects.toThrow('Only the person');
    expect(await CrmViewModel.countDocuments()).toBe(1);
  });

  it('says when the view is gone', async () => {
    await expect(updateView(asOwner, missingId(), view())).rejects.toThrow('View not found');
    await expect(deleteView(asOwner, missingId())).rejects.toThrow('View not found');
  });

  it('says so when the view is deleted while it is being changed', async () => {
    const saved = await createView(asOwner, view());
    jest
      .spyOn(CrmViewModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

    await expect(updateView(asOwner, saved.id, view())).rejects.toThrow('View not found');
  });

  it('owner deletes their own view', async () => {
    const saved = await createView(asOwner, view());
    await expect(deleteView(asOwner, saved.id)).resolves.toBe(true);
    expect(await CrmViewModel.findById(saved.id)).toBeNull();
  });
});

describe('viewObject', () => {
  it('names the record type a view lists', async () => {
    const saved = await createView(
      asOwner,
      view({ object: 'COMPANY', groups: [], sorts: [], columns: ['domain'] }),
    );
    expect(await viewObject(saved.id)).toBe('COMPANY');
  });

  it('says when the view is gone', async () => {
    await expect(viewObject(missingId())).rejects.toThrow('View not found');
  });
});
