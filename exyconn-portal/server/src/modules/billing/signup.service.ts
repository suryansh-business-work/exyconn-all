import { randomBytes } from 'node:crypto';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../lib/emailCode';
import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';
import { authService } from '../auth/auth.service';
import { emailer } from '../email/email.service';
import { OrganizationModel } from '../organizations/organization.model';
import { organizationService } from '../organizations/organizations.service';
import { planService } from './plan.service';
import { subscriptionService } from './subscription.service';

/** What the sign-up form sends with the emailed code. */
export interface SignupInput {
  email: string;
  code: string;
  name: string;
  companyName: string;
  currency: string;
  country?: string;
  timezone?: string;
  planId: string;
}

const codeAddressLimiter = createLimiter({
  keyPrefix: 'saas_signup_code_address',
  points: 5,
  durationSec: 60 * 60,
});
const codeIpLimiter = createLimiter({
  keyPrefix: 'saas_signup_code_ip',
  points: 20,
  durationSec: 60 * 60,
});
const completeAddressLimiter = createLimiter({
  keyPrefix: 'saas_signup_complete_address',
  points: 15,
  durationSec: 15 * 60,
});

const normalEmail = (email: string) => email.trim().toLowerCase();

/**
 * The company sign-up codes are sent from: Exyconn itself, the platform operator. Its email
 * templates and sender are what a new customer sees before their own company exists.
 */
async function senderOrganization(): Promise<string> {
  const id = await platformOperatorOrganizationId();
  if (!id) badRequest('Sign-up is not open on this install yet.');
  return id;
}

/** An address that already signs in somewhere cannot start a second company. */
async function assertAddressFree(email: string): Promise<void> {
  const taken = await runAsPlatform(() =>
    UserModel.exists({ email }).setOptions({ withDeleted: true }),
  );
  if (taken) badRequest('This email already has an account. Sign in instead.');
}

/** A free handle for the company: its name, or its name with a short suffix when taken. */
async function freeSlug(name: string): Promise<string | undefined> {
  const base = name
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z\d]+/g, '-')
    .replaceAll(/^-|-$/g, '');
  const taken = await runAsPlatform(() => OrganizationModel.exists({ slug: base }));
  return taken ? `${base}-${randomBytes(3).toString('hex')}` : undefined;
}

/** Step one: emails a six-digit code to the person signing their company up. */
export async function requestSignupCode(rawEmail: string, ip: string): Promise<boolean> {
  const email = normalEmail(rawEmail);
  if (!isEmailAddress(email)) badRequest('Enter a valid email address.');
  await enforceLimit(codeIpLimiter, ip, 'code requests');
  await enforceLimit(codeAddressLimiter, email, 'codes for this address');
  await assertAddressFree(email);
  const sender = await senderOrganization();
  await runForOrganization(sender, async () => {
    const code = await issueEmailCode('saas-signup', email);
    try {
      await emailer.send({
        template: 'saas-signup-code',
        to: email,
        variables: { code, expiresIn: EMAIL_CODE_TTL_LABEL },
        triggeredBy: 'Company sign-up',
      });
    } catch (error) {
      logger.error({ err: error }, 'Sign-up code email failed');
      badRequest('We could not send the code just now. Try again in a minute.');
    }
  });
  return true;
}

/**
 * Step two: proves the address with its code, then creates the company through the same path a
 * platform administrator uses (organizations.service — provisioned defaults and all), makes the
 * person its administrator (emailed a temporary password, like any administrator) and starts
 * the chosen plan's trial. Returns the user, signed in.
 */
export async function completeSignup(input: SignupInput, from: { ip: string; userAgent: string }) {
  const email = normalEmail(input.email);
  await enforceLimit(completeAddressLimiter, email, 'code attempts');
  const plan = await planService.get(input.planId);
  if (!plan.isActive || !plan.isPublic || plan.isSystem) {
    badRequest('That plan cannot be chosen. Pick one from the list.');
  }
  if (input.name.trim() === '' || input.companyName.trim() === '') {
    badRequest('Your name and your company name are both needed.');
  }
  const sender = await senderOrganization();
  await runForOrganization(sender, () => consumeEmailCode('saas-signup', email, input.code));
  await assertAddressFree(email);

  const organization = await organizationService.create({
    name: input.companyName.trim(),
    slug: await freeSlug(input.companyName),
    currency: input.currency,
    country: input.country,
    timezone: input.timezone,
    contactEmail: email,
  });
  const organizationId = String(organization._id);
  const admin = await organizationService.assignAdmin(organizationId, {
    name: input.name.trim(),
    email,
  });
  await subscriptionService.startTrial(organizationId, plan);
  logger.info(`Self sign-up created ${organization.name} on plan ${plan.key}`);

  const user = await runAsPlatform(() => UserModel.findById(admin._id));
  if (!user) badRequest('Your account could not be opened. Sign in with the emailed password.');
  return { organization, plan, result: await authService.issueSession(user, from) };
}
