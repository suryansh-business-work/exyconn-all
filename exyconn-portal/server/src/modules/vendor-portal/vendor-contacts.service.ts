import { runAsPlatform } from '../../lib/tenant';
import { env } from '../../config/env';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailer } from '../email/email.service';
import { SupplierModel } from '../products/supplier.model';
import { VendorContactModel } from './vendor-contact.model';

export interface VendorContactInput {
  supplierId: string;
  name: string;
  email: string;
}

/**
 * Who at a supplier may use the vendor portal — given and taken away from Products › Suppliers.
 * Runs in the buyer's company, so a supplier and its contacts are always the same company's.
 */
export const vendorContactsService = {
  list(supplierId: string) {
    return VendorContactModel.find({ supplierId }).sort({ createdAt: 1 }).lean();
  },

  /** Gives somebody access and emails them where to sign in. */
  async add(input: VendorContactInput) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (name === '' || name.length > 120) badRequest('Enter the person’s name.');
    if (!isEmailAddress(email)) badRequest('Enter a valid email address.');
    const supplier = await SupplierModel.findById(input.supplierId).select('name').lean();
    if (!supplier) notFound('Supplier');
    // Addresses are unique across the platform: one address signs in to one supplier.
    const taken = await runAsPlatform(() => VendorContactModel.exists({ email }));
    if (taken) badRequest('That email already has vendor portal access.');

    const contact = await VendorContactModel.create({ supplierId: input.supplierId, name, email });
    emailer
      .send({
        template: 'vendor-portal-invite',
        to: email,
        variables: { name, supplierName: supplier.name, portalUrl: env.vendorPortalUrl },
        triggeredBy: 'Vendor portal access granted',
      })
      .catch((error: unknown) => logger.error({ err: error }, 'Vendor portal invite email failed'));
    return contact.toObject();
  },

  /** Switching access off signs the person out of the vendor portal at once. */
  async setActive(id: string, active: boolean) {
    const contact = await VendorContactModel.findByIdAndUpdate(
      id,
      active ? { active } : { active, $inc: { tokenVersion: 1 } },
      { new: true },
    ).lean();
    if (!contact) notFound('Vendor contact');
    return contact;
  },

  async remove(id: string) {
    const contact = await VendorContactModel.findByIdAndDelete(id).lean();
    if (!contact) notFound('Vendor contact');
    return contact;
  },
};
