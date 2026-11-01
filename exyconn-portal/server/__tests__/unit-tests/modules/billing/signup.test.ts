import { Types } from 'mongoose';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { organizationOf, runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { EmailCodeModel } from '../../../../src/lib/emailCode/emailCode.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { authService } from '../../../../src/modules/auth/auth.service';
import { emailer } from '../../../../src/modules/email/email.service';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { signupResolvers } from '../../../../src/modules/billing/signup.resolvers';
import type { SignupInput } from '../../../../src/modules/billing/signup.service';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { seedPlan, subscriptionOf } from './fixtures';

const { Query, Mutation } = signupResolvers;
const visitor = { user: null, ip: '198.51.100.4', userAgent: 'jest' } as GraphQLContext;

let sendMock: jest.SpyInstance;
let planId: string;
let counter = 0;
let email: string;

/** The code the last sign-up email carried. */
const lastCode = () => String(sendMock.mock.calls.at(-1)?.[0].variables.code);

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  counter += 1;
  email = `founder${counter}@newco.test`;
  sendMock = jest.spyOn(emailer, 'send').mockResolvedValue(undefined as never);
  await runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  );
  planId = String((await seedPlan({ trialDays: 14 }))._id);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const input = (fields: Partial<SignupInput> = {}): SignupInput => ({
  email: ` ${email.toUpperCase()} `,
  code: lastCode(),
  name: 'Ada Lovelace',
  companyName: 'New Co',
  currency: 'USD',
  country: 'GB',
  timezone: 'Europe/London',
  planId,
  ...fields,
});

const companies = () => runAsPlatform(() => OrganizationModel.countDocuments());

describe('signupPlans', () => {
  it('offers only active public plans', async () => {
    await seedPlan({ key: 'hidden', isPublic: false });

    const plans = await Query.signupPlans();

    expect(plans.map((plan) => plan.key)).toEqual(['growth']);
    expect(plans[0].id).toBe(planId);
  });
});

describe('requestSignupCode', () => {
  it('emails a six-digit code from the platform operator', async () => {
    expect(await Mutation.requestSignupCode(null, { email: ` ${email} ` }, visitor)).toBe(true);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'saas-signup-code',
        to: email,
        variables: expect.objectContaining({ expiresIn: '10 minutes' }),
      }),
    );
    expect(lastCode()).toMatch(/^\d{6}$/);
  });

  it('refuses a malformed address', async () => {
    await expect(
      Mutation.requestSignupCode(null, { email: 'not-an-email' }, visitor),
    ).rejects.toThrow('Enter a valid email address.');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('refuses an address that already has an account, even a deleted one', async () => {
    await runAsPlatform(() =>
      UserModel.create({
        name: 'Old',
        email,
        passwordHash: 'hash',
        roles: ['EMPLOYEE'],
        deletedAt: new Date(),
      }),
    );

    await expect(Mutation.requestSignupCode(null, { email }, visitor)).rejects.toThrow(
      'This email already has an account. Sign in instead.',
    );
  });

  it('is closed while no company operates the platform', async () => {
    await runAsPlatform(() => OrganizationModel.updateMany({}, { isPlatformOperator: false }));
    invalidatePlatformOperatorCache();

    await expect(Mutation.requestSignupCode(null, { email }, visitor)).rejects.toThrow(
      'Sign-up is not open on this install yet.',
    );
  });

  it('says so when the email cannot be sent', async () => {
    sendMock.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(Mutation.requestSignupCode(null, { email }, visitor)).rejects.toThrow(
      'We could not send the code just now. Try again in a minute.',
    );
  });

  it('limits codes for one address to five an hour', async () => {
    for (let i = 0; i < 5; i += 1) {
      await Mutation.requestSignupCode(null, { email }, visitor);
    }

    await expect(Mutation.requestSignupCode(null, { email }, visitor)).rejects.toThrow(
      /Too many codes for this address/,
    );
  });

  it('counts requests without a known address against one shared bucket', async () => {
    await expect(
      Mutation.requestSignupCode(null, { email }, { user: null } as GraphQLContext),
    ).resolves.toBe(true);
  });
});

describe('completeSignup', () => {
  beforeEach(async () => {
    await Mutation.requestSignupCode(null, { email }, visitor);
  });

  it('creates the company, its administrator and the trial, and signs the person in', async () => {
    const result = await Mutation.completeSignup(null, { input: input() }, visitor);

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toMatchObject({ email, name: 'Ada Lovelace' });
    const company = await runAsPlatform(() => OrganizationModel.findOne({ slug: 'new-co' }).lean());
    expect(company).toMatchObject({
      name: 'New Co',
      contactEmail: email,
      timezone: 'Europe/London',
    });
    const organizationId = String(company?._id);
    const admin = await runAsPlatform(() => UserModel.findOne({ email }).lean());
    expect(admin?.roles).toContain('ADMIN');
    expect(organizationOf(admin ?? {})).toBe(organizationId);
    expect(await subscriptionOf(organizationId)).toMatchObject({
      planId,
      status: 'TRIALING',
      provider: 'NONE',
    });
    const summaries = (
      await runForOrganization(organizationId, () => AuditLogModel.find().lean())
    ).map((row) => row.summary);
    expect(summaries).toEqual(
      expect.arrayContaining([
        'Signed up New Co on a trial of Growth',
        'Signed in after creating the company',
      ]),
    );
  });

  it('gives a company whose name is taken a suffixed handle', async () => {
    await runAsPlatform(() =>
      OrganizationModel.create({ name: 'New Co', slug: 'new-co', currency: 'USD' }),
    );

    await Mutation.completeSignup(null, { input: input({ companyName: 'New Co!' }) }, visitor);

    const created = await runAsPlatform(() =>
      OrganizationModel.findOne({ contactEmail: email }).lean(),
    );
    expect(created?.slug).toMatch(/^new-co-[\da-f]{6}$/);
  });

  it('refuses a wrong code and creates nothing', async () => {
    const wrong = lastCode() === '000000' ? '111111' : '000000';

    await expect(
      Mutation.completeSignup(null, { input: input({ code: wrong }) }, visitor),
    ).rejects.toThrow('That code is not right.');
    expect(await companies()).toBe(1);
  });

  it('refuses an expired code and creates nothing', async () => {
    await runAsPlatform(() =>
      EmailCodeModel.updateMany({}, { expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(Mutation.completeSignup(null, { input: input() }, visitor)).rejects.toThrow(
      'That code has expired. Ask for a new one.',
    );
    expect(await companies()).toBe(1);
  });

  it('refuses a code already spent, so one code makes one company', async () => {
    const code = lastCode();
    await Mutation.completeSignup(null, { input: input({ code }) }, visitor);

    await expect(
      Mutation.completeSignup(null, { input: input({ code, companyName: 'Twin Co' }) }, visitor),
    ).rejects.toThrow('That code has expired. Ask for a new one.');
    expect(await companies()).toBe(2);
  });

  it.each([
    ['a retired plan', { isActive: false }],
    ['a private plan', { isPublic: false }],
    ['the grandfathered plan', { isSystem: true }],
  ])('refuses %s', async (_label, fields) => {
    const plan = await seedPlan({ key: 'other', ...fields });

    await expect(
      Mutation.completeSignup(null, { input: input({ planId: String(plan._id) }) }, visitor),
    ).rejects.toThrow('That plan cannot be chosen. Pick one from the list.');
  });

  it('refuses a plan that does not exist', async () => {
    await expect(
      Mutation.completeSignup(
        null,
        { input: input({ planId: new Types.ObjectId().toHexString() }) },
        visitor,
      ),
    ).rejects.toThrow('Plan not found');
  });

  it('needs both names', async () => {
    await expect(
      Mutation.completeSignup(null, { input: input({ name: ' ' }) }, visitor),
    ).rejects.toThrow('Your name and your company name are both needed.');
    await expect(
      Mutation.completeSignup(null, { input: input({ companyName: '' }) }, visitor),
    ).rejects.toThrow('Your name and your company name are both needed.');
  });

  it('refuses an address that signed up somewhere else after the code was sent', async () => {
    await runAsPlatform(() =>
      UserModel.create({ name: 'Raced', email, passwordHash: 'hash', roles: ['EMPLOYEE'] }),
    );

    await expect(Mutation.completeSignup(null, { input: input() }, visitor)).rejects.toThrow(
      'This email already has an account. Sign in instead.',
    );
    expect(await companies()).toBe(1);
  });

  it('asks the person to sign in when their account cannot be read back', async () => {
    jest.spyOn(UserModel, 'findById').mockResolvedValueOnce(null as never);

    await expect(Mutation.completeSignup(null, { input: input() }, visitor)).rejects.toThrow(
      'Your account could not be opened. Sign in with the emailed password.',
    );
  });

  it('limits attempts at one address', async () => {
    const issue = jest.spyOn(authService, 'issueSession');
    const wrong = lastCode() === '000000' ? '111111' : '000000';
    for (let i = 0; i < 15; i += 1) {
      await Mutation.completeSignup(null, { input: input({ code: wrong }) }, visitor).catch(
        () => undefined,
      );
    }

    await expect(Mutation.completeSignup(null, { input: input() }, visitor)).rejects.toThrow(
      /Too many code attempts/,
    );
    expect(issue).not.toHaveBeenCalled();
  });
});
