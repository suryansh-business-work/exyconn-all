import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../lib/emailCode';
import { readPass, signPass } from '../../lib/scopedPass';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailer } from '../email/email.service';
import { SupplierModel } from '../products/supplier.model';
import { VendorContactModel } from './vendor-contact.model';

/** The header the vendor portal sends its pass in. */
export const VENDOR_PASS_HEADER = 'x-vendor-pass';
/** A vendor portal session lasts a month; signing in again is an email and a code. */
const PASS_LIFETIME = '30d';

/** A signed-in vendor portal contact, as a request knows them. */
export interface VendorContact {
  id: string;
  supplierId: string;
  name: string;
  email: string;
  /** The company buying from the supplier — every vendor portal read is confined to it. */
  organizationId: string;
}

const codeAddressLimiter = createLimiter({
  keyPrefix: 'vendor_code_address',
  points: 5,
  durationSec: 60 * 60,
});
const codeIpLimiter = createLimiter({ keyPrefix: 'vendor_code_ip', points: 20, durationSec: 3600 });
const verifyAddressLimiter = createLimiter({
  keyPrefix: 'vendor_verify_address',
  points: 15,
  durationSec: 15 * 60,
});

const normalEmail = (email: string) => email.trim().toLowerCase();

/** The active contact for an address, across companies (an address names one contact). */
async function contactByEmail(email: string) {
  const contact = await runAsPlatform(() =>
    VendorContactModel.findOne({ email, active: true }).lean(),
  );
  const organizationId = contact ? organizationOf(contact) : null;
  return contact && organizationId ? { contact, organizationId } : null;
}

/** Emails a sign-in code to a supplier's contact with vendor portal access. */
export async function requestVendorPortalCode(rawEmail: string, ip: string): Promise<boolean> {
  const email = normalEmail(rawEmail);
  if (!isEmailAddress(email)) {
    badRequest('Enter a valid email address.');
  }
  await enforceLimit(codeIpLimiter, ip, 'code requests');
  await enforceLimit(codeAddressLimiter, email, 'codes for this address');
  const found = await contactByEmail(email);
  if (!found) {
    badRequest('This email does not have vendor portal access yet. Ask your buyer to add it.');
  }
  await runForOrganization(found.organizationId, async () => {
    const code = await issueEmailCode('vendor-portal', email);
    try {
      await emailer.send({
        template: 'vendor-portal-code',
        to: email,
        variables: { name: found.contact.name, code, expiresIn: EMAIL_CODE_TTL_LABEL },
        triggeredBy: 'Vendor portal sign-in',
      });
    } catch (error) {
      logger.error({ err: error }, 'Vendor portal code email failed');
      badRequest('We could not send the code just now. Try again in a minute.');
    }
  });
  return true;
}

/** Signs a contact in with the code from their email and hands back their vendor pass. */
export async function verifyVendorPortalCode(rawEmail: string, code: string) {
  const email = normalEmail(rawEmail);
  await enforceLimit(verifyAddressLimiter, email, 'code attempts');
  const found = await contactByEmail(email);
  if (!found) {
    badRequest('That code has expired. Ask for a new one.');
  }
  return runForOrganization(found.organizationId, async () => {
    await consumeEmailCode('vendor-portal', email, code);
    const contact = await VendorContactModel.findOneAndUpdate(
      { _id: found.contact._id, active: true },
      { $set: { lastSignInAt: new Date() }, $inc: { signInCount: 1 } },
      { new: true },
    ).lean();
    if (!contact) {
      badRequest('Vendor portal access for this address has been switched off.');
    }
    const token = signPass(
      'vendor-portal',
      { sub: String(contact._id), tv: contact.tokenVersion },
      PASS_LIFETIME,
    );
    return { token, name: contact.name, email: contact.email };
  });
}

/**
 * The contact a pass belongs to, or null when the pass is forged, expired or retired, the
 * contact was switched off, or their supplier no longer exists.
 */
export async function vendorForPass(token: string): Promise<VendorContact | null> {
  const claims = readPass('vendor-portal', token);
  if (!claims) {
    return null;
  }
  const contact = await runAsPlatform(() => VendorContactModel.findById(claims.sub).lean());
  const organizationId = contact ? organizationOf(contact) : null;
  if (!contact || !organizationId || !contact.active || contact.tokenVersion !== claims.tv) {
    return null;
  }
  const supplier = await runForOrganization(organizationId, () =>
    SupplierModel.exists({ _id: contact.supplierId }),
  );
  if (!supplier) {
    return null;
  }
  return {
    id: String(contact._id),
    supplierId: contact.supplierId,
    name: contact.name,
    email: contact.email,
    organizationId,
  };
}
