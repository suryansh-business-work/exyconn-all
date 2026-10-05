import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../lib/emailCode';
import { readPass, signPass } from '../../lib/scopedPass';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailer } from '../email/email.service';
import { ClientModel } from '../clients/clients.model';
import { ClientContactModel } from './contact.model';

/** The header the client hub sends its pass in. */
export const CLIENT_PASS_HEADER = 'x-client-pass';
/** A client hub session lasts a month; signing in again is an email and a code. */
const PASS_LIFETIME = '30d';

/** A signed-in client hub contact, as a request knows them. */
export interface ClientHubContact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  /** The company the client belongs to — every client hub read is confined to it. */
  organizationId: string;
}

const codeAddressLimiter = createLimiter({
  keyPrefix: 'clienthub_code_address',
  points: 5,
  durationSec: 60 * 60,
});
const codeIpLimiter = createLimiter({
  keyPrefix: 'clienthub_code_ip',
  points: 20,
  durationSec: 60 * 60,
});
const verifyAddressLimiter = createLimiter({
  keyPrefix: 'clienthub_verify_address',
  points: 15,
  durationSec: 15 * 60,
});

const normalEmail = (email: string) => email.trim().toLowerCase();

/** The active contact for an address, across companies (an address names one contact). */
async function contactByEmail(email: string) {
  const contact = await runAsPlatform(() =>
    ClientContactModel.findOne({ email, active: true }).lean(),
  );
  const organizationId = contact ? organizationOf(contact) : null;
  return contact && organizationId ? { contact, organizationId } : null;
}

/**
 * Emails a sign-in code to a contact with client hub access. An address without access is
 * answered the same way and sent nothing, so the form never confirms who is a client.
 */
export async function requestClientHubCode(rawEmail: string, ip: string): Promise<boolean> {
  const email = normalEmail(rawEmail);
  if (!isEmailAddress(email)) {
    badRequest('Enter a valid email address.');
  }
  await enforceLimit(codeIpLimiter, ip, 'code requests');
  await enforceLimit(codeAddressLimiter, email, 'codes for this address');
  const found = await contactByEmail(email);
  if (!found) {
    return true;
  }
  await runForOrganization(found.organizationId, async () => {
    const code = await issueEmailCode('client-hub', email);
    try {
      await emailer.send({
        template: 'client-hub-code',
        to: email,
        variables: { name: found.contact.name, code, expiresIn: EMAIL_CODE_TTL_LABEL },
        triggeredBy: 'Client hub sign-in',
      });
    } catch (error) {
      logger.error({ err: error }, 'Client hub code email failed');
      badRequest('We could not send the code just now. Try again in a minute.');
    }
  });
  return true;
}

/** Signs a contact in with the code from their email and hands back their client hub pass. */
export async function verifyClientHubCode(rawEmail: string, code: string) {
  const email = normalEmail(rawEmail);
  await enforceLimit(verifyAddressLimiter, email, 'code attempts');
  const found = await contactByEmail(email);
  if (!found) {
    badRequest('That code has expired. Ask for a new one.');
  }
  return runForOrganization(found.organizationId, async () => {
    await consumeEmailCode('client-hub', email, code);
    const contact = await ClientContactModel.findOneAndUpdate(
      { _id: found.contact._id, active: true },
      { $set: { lastSignInAt: new Date() }, $inc: { signInCount: 1 } },
      { new: true },
    ).lean();
    if (!contact) {
      badRequest('Client hub access for this address has been switched off.');
    }
    const token = signPass(
      'client-hub',
      { sub: String(contact._id), tv: contact.tokenVersion },
      PASS_LIFETIME,
    );
    return { token, name: contact.name, email: contact.email };
  });
}

/**
 * The contact a pass belongs to, or null when the pass is forged, expired or retired, the
 * contact was switched off, or their client no longer exists.
 */
export async function contactForPass(token: string): Promise<ClientHubContact | null> {
  const claims = readPass('client-hub', token);
  if (!claims) {
    return null;
  }
  const contact = await runAsPlatform(() => ClientContactModel.findById(claims.sub).lean());
  const organizationId = contact ? organizationOf(contact) : null;
  if (!contact || !organizationId || !contact.active || contact.tokenVersion !== claims.tv) {
    return null;
  }
  const client = await runForOrganization(organizationId, () =>
    ClientModel.exists({ _id: contact.clientId }),
  );
  if (!client) {
    return null;
  }
  return {
    id: String(contact._id),
    clientId: contact.clientId,
    name: contact.name,
    email: contact.email,
    organizationId,
  };
}
