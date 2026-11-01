import { VendorContactModel } from '../../../src/modules/vendor-portal/vendor-contact.model';
import { SupplierModel } from '../../../src/modules/products/supplier.model';
import { signPass } from '../../../src/lib/scopedPass';
import { signToken } from '../../../src/utils/jwt';
import { ROLES } from '../../../src/constants/roles';
import { useTestOrganization } from '../../helpers';
import { contextOf, requestWith, seedPerson } from './authHarness';

jest.mock('../../../src/modules/admin/presence', () => ({
  recordActivity: jest.fn().mockResolvedValue(undefined),
}));

const organizationId = useTestOrganization();
const IP = '198.51.100.4';

async function seedVendorPass() {
  const supplier = await SupplierModel.create({ name: 'Widgets Ltd', code: 'WID' });
  const contact = await VendorContactModel.create({
    supplierId: supplier._id.toHexString(),
    name: 'Sam Patel',
    email: 'sam@widgets.test',
  });
  const pass = signPass('vendor-portal', { sub: contact._id.toHexString(), tv: 0 }, '1h');
  return { contact, pass };
}

describe('buildContext for a vendor portal contact', () => {
  it('speaks only for the contact, even with a portal session alongside, and enters no company', async () => {
    const { contact, pass } = await seedVendorPass();
    const person = await seedPerson(organizationId, [ROLES.ADMIN]);
    const token = signToken({ id: person.id, email: person.email, roles: [ROLES.ADMIN] });

    const { ctx, scope } = await contextOf(
      requestWith({ ip: IP, headers: { 'x-vendor-pass': pass, authorization: `Bearer ${token}` } }),
    );

    expect(ctx.user).toBeNull();
    expect(ctx.vendorContact).toEqual({
      id: contact._id.toHexString(),
      supplierId: contact.supplierId,
      name: 'Sam Patel',
      email: 'sam@widgets.test',
      organizationId,
    });
    expect(ctx.clientContact).toBeUndefined();
    expect(scope.organizationId).toBeNull();
  });

  it('is nobody — not the staff session beside it — when the vendor pass is forged', async () => {
    const person = await seedPerson(organizationId, [ROLES.ADMIN]);
    const token = signToken({ id: person.id, email: person.email, roles: [ROLES.ADMIN] });

    const { ctx } = await contextOf(
      requestWith({
        ip: IP,
        headers: { 'x-vendor-pass': 'forged.pass.value', authorization: `Bearer ${token}` },
      }),
    );

    expect(ctx).toMatchObject({ user: null, organizationId: null, ip: IP });
    expect(ctx.vendorContact).toBeUndefined();
  });

  it('is nobody once the contact is switched off', async () => {
    const { contact, pass } = await seedVendorPass();
    await VendorContactModel.updateOne({ _id: contact._id }, { active: false });

    const { ctx } = await contextOf(requestWith({ ip: IP, headers: { 'x-vendor-pass': pass } }));

    expect(ctx.vendorContact).toBeUndefined();
    expect(ctx.user).toBeNull();
  });
});
