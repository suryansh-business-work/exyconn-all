import {
  requestVendorPortalCode,
  vendorForPass,
  verifyVendorPortalCode,
} from '../../../../src/modules/vendor-portal/vendor.auth';
import { VendorContactModel } from '../../../../src/modules/vendor-portal/vendor-contact.model';
import { SupplierModel } from '../../../../src/modules/products/supplier.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { readPass, signPass } from '../../../../src/lib/scopedPass';
import { runAsPlatform } from '../../../../src/lib/tenant';
import * as vendorPortal from '../../../../src/modules/vendor-portal';
import { useTestOrganization } from '../../../helpers';
import { asArg } from '../../../mockAs';

const organizationId = useTestOrganization();
const IP = 'test-connection';
const EMAIL = 'sam@widgets.test';

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function seedContact(overrides: Record<string, unknown> = {}) {
  const supplier = await SupplierModel.create({ name: 'Widgets Ltd', code: 'WID' });
  return VendorContactModel.create({
    supplierId: supplier._id.toHexString(),
    name: 'Sam Patel',
    email: EMAIL,
    ...overrides,
  });
}

const sentCode = (): string => send.mock.calls.at(-1)[0].variables.code;

describe('requestVendorPortalCode', () => {
  it('emails a six-digit code to a contact with access, whatever the address case', async () => {
    await seedContact();

    expect(await requestVendorPortalCode('  Sam@Widgets.TEST ', IP)).toBe(true);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'vendor-portal-code',
        to: EMAIL,
        variables: expect.objectContaining({ name: 'Sam Patel', expiresIn: '10 minutes' }),
      }),
    );
    expect(sentCode()).toMatch(/^\d{6}$/);
  });

  it('refuses something that is not an email address', async () => {
    await expect(requestVendorPortalCode('not-an-address', IP)).rejects.toThrow(/valid email/);
    expect(send).not.toHaveBeenCalled();
  });

  it('tells an address without access so, and sends nothing', async () => {
    await expect(requestVendorPortalCode('nobody@widgets.test', IP)).rejects.toThrow(
      /does not have vendor portal access/,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('treats a switched-off contact as having no access', async () => {
    await seedContact({ active: false });

    await expect(requestVendorPortalCode(EMAIL, IP)).rejects.toThrow(/does not have/);
    expect(send).not.toHaveBeenCalled();
  });

  it('treats a contact that belongs to no company as having no access', async () => {
    await runAsPlatform(() =>
      VendorContactModel.create({ supplierId: 's1', name: 'Orphan', email: EMAIL }),
    );

    await expect(requestVendorPortalCode(EMAIL, IP)).rejects.toThrow(/does not have/);
  });

  it('asks the person to retry when the email cannot be sent', async () => {
    await seedContact();
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(requestVendorPortalCode(EMAIL, IP)).rejects.toThrow(/could not send the code/);
  });
});

describe('verifyVendorPortalCode', () => {
  it('signs the contact in with the emailed code, counts it and issues a vendor pass', async () => {
    const contact = await seedContact();
    await requestVendorPortalCode(EMAIL, IP);

    const session = await verifyVendorPortalCode(EMAIL.toUpperCase(), sentCode());

    expect(session).toMatchObject({ name: 'Sam Patel', email: EMAIL });
    const stored = await VendorContactModel.findById(contact._id).lean();
    expect(stored?.signInCount).toBe(1);
    expect(stored?.lastSignInAt).toBeInstanceOf(Date);
    expect(readPass('vendor-portal', session.token)).toMatchObject({
      sub: contact._id.toHexString(),
      tv: 0,
    });
    // A vendor pass is not a client hub pass, nor the other way round.
    expect(readPass('client-hub', session.token)).toBeNull();
    expect(await vendorForPass(session.token)).toMatchObject({
      id: contact._id.toHexString(),
      email: EMAIL,
      organizationId,
    });
  });

  it('refuses a wrong code and does not count a sign-in', async () => {
    const contact = await seedContact();
    await requestVendorPortalCode(EMAIL, IP);
    const wrong = sentCode() === '000000' ? '111111' : '000000';

    await expect(verifyVendorPortalCode(EMAIL, wrong)).rejects.toThrow(/not right/);
    expect((await VendorContactModel.findById(contact._id).lean())?.signInCount).toBe(0);
  });

  it('refuses a code used twice', async () => {
    await seedContact();
    await requestVendorPortalCode(EMAIL, IP);
    const code = sentCode();
    await verifyVendorPortalCode(EMAIL, code);

    await expect(verifyVendorPortalCode(EMAIL, code)).rejects.toThrow();
  });

  it('refuses an address with no access as an expired code', async () => {
    await expect(verifyVendorPortalCode('ghost@widgets.test', '123456')).rejects.toThrow(/expired/);
  });

  it('refuses when access is switched off while the code is being checked', async () => {
    await seedContact();
    await requestVendorPortalCode(EMAIL, IP);
    jest
      .spyOn(VendorContactModel, 'findOneAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

    await expect(verifyVendorPortalCode(EMAIL, sentCode())).rejects.toThrow(/switched off/);
  });
});

describe('vendorForPass', () => {
  const passFor = (id: unknown, tv = 0) => signPass('vendor-portal', { sub: String(id), tv }, '1h');

  it('returns the contact a live pass names, with the buying company', async () => {
    const contact = await seedContact();

    expect(await vendorForPass(passFor(contact._id))).toEqual({
      id: contact._id.toHexString(),
      supplierId: contact.supplierId,
      name: 'Sam Patel',
      email: EMAIL,
      organizationId,
    });
  });

  it('refuses a forged pass', async () => {
    expect(await vendorForPass('not.a.pass')).toBeNull();
  });

  it('refuses a client hub pass presented as a vendor pass', async () => {
    const contact = await seedContact();
    const clientPass = signPass('client-hub', { sub: contact._id.toHexString(), tv: 0 }, '1h');

    expect(await vendorForPass(clientPass)).toBeNull();
  });

  it('refuses an expired pass', async () => {
    const contact = await seedContact();
    const expired = signPass('vendor-portal', { sub: contact._id.toHexString(), tv: 0 }, '-1s');

    expect(await vendorForPass(expired)).toBeNull();
  });

  it('refuses a pass whose contact was deleted', async () => {
    const contact = await seedContact();
    await VendorContactModel.deleteOne({ _id: contact._id });

    expect(await vendorForPass(passFor(contact._id))).toBeNull();
  });

  it('refuses a pass for a contact that belongs to no company', async () => {
    const orphan = await runAsPlatform(() =>
      VendorContactModel.create({ supplierId: 's1', name: 'Orphan', email: EMAIL }),
    );

    expect(await vendorForPass(passFor(orphan._id))).toBeNull();
  });

  it('refuses a pass once the contact is switched off', async () => {
    const contact = await seedContact({ active: false });

    expect(await vendorForPass(passFor(contact._id))).toBeNull();
  });

  it('refuses a pass issued before the token version was raised', async () => {
    const contact = await seedContact({ tokenVersion: 2 });

    expect(await vendorForPass(passFor(contact._id, 1))).toBeNull();
  });

  it('refuses a pass whose supplier no longer exists', async () => {
    const contact = await seedContact();
    await SupplierModel.deleteOne({ _id: contact.supplierId });

    expect(await vendorForPass(passFor(contact._id))).toBeNull();
  });
});

describe('sign-in operations', () => {
  const { Mutation } = vendorPortal.vendorPortalResolvers;

  it('emails a code and exchanges it for a pass, with or without a known address', async () => {
    const contact = await seedContact();

    expect(await Mutation.requestVendorPortalCode(null, { email: EMAIL }, { user: null })).toBe(
      true,
    );
    const session = await Mutation.verifyVendorPortalCode(null, {
      email: EMAIL,
      code: sentCode(),
    });
    expect((await vendorForPass(session.token))?.id).toBe(contact._id.toHexString());

    expect(
      await Mutation.requestVendorPortalCode(null, { email: EMAIL }, { user: null, ip: IP }),
    ).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe('vendor portal module surface', () => {
  it('names the header the vendors app sends its pass in, and the pass reader the middleware uses', () => {
    expect(vendorPortal.VENDOR_PASS_HEADER).toBe('x-vendor-pass');
    expect(vendorPortal.vendorForPass).toBe(vendorForPass);
  });

  it('offers the supplier operations and the buyer operations as separate schemas', () => {
    const supplierSide = JSON.stringify(vendorPortal.vendorPortalTypeDefs);
    const buyerSide = JSON.stringify(vendorPortal.vendorStaffTypeDefs);

    expect(supplierSide).toContain('vendorSubmitInvoice');
    expect(supplierSide).not.toContain('approveVendorInvoice');
    expect(buyerSide).toContain('approveVendorInvoice');
    expect(buyerSide).not.toContain('vendorSubmitInvoice');
  });
});
