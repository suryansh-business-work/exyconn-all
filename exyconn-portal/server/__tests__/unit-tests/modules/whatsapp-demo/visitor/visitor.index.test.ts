import { Types } from 'mongoose';
import {
  VISITOR_HEADER,
  visitorForPass,
  whatsappDemoVisitorResolvers,
  whatsappDemoVisitorTypeDefs,
} from '../../../../../src/modules/whatsapp-demo/visitor';
import { WhatsappDemoVisitorModel } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.model';
import { emailer } from '../../../../../src/modules/email/email.service';
import { ROLES, type Role } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { codeOf } from '../../codeOf';
import { solvedCaptcha } from '../../../../helpers';
import { seedVisitor, useOperatorOrganization } from './visitor.fixtures';

const operatorId = useOperatorOrganization();
const { Query, Mutation } = whatsappDemoVisitorResolvers;

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

const staff = (roles: Role[], organizationId: string | null = operatorId): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'staff@test.co', roles, organizationId },
});
const page = { page: 0, pageSize: 10 };

describe('whatsappDemoVisitorMe', () => {
  it('is the signed-in visitor, read in the demo owner company', async () => {
    const visitor = await seedVisitor();
    const demoVisitor = {
      id: visitor._id.toHexString(),
      name: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      company: visitor.company,
      organizationId: operatorId,
    };

    const me = await Query.whatsappDemoVisitorMe(null, null, { user: null, demoVisitor });

    expect(me?.id).toBe(visitor._id.toHexString());
  });

  it('is nobody for a request without a visitor pass', async () => {
    expect(await Query.whatsappDemoVisitorMe(null, null, { user: null })).toBeNull();
  });
});

describe('the leads list', () => {
  it('lets website staff of the operator company list, count, block and delete leads', async () => {
    const visitor = await seedVisitor();
    const ctx = staff([ROLES.WEBSITE]);
    const id = visitor._id.toHexString();

    expect((await Query.whatsappDemoVisitorsPaged(null, { input: page }, ctx)).totalCount).toBe(1);
    expect((await Query.whatsappDemoVisitorStats(null, null, ctx)).total).toBe(1);
    const blocked = await Mutation.setWhatsappDemoVisitorBlocked(null, { id, blocked: true }, ctx);
    expect(blocked.blocked).toBe(true);
    await expect(Mutation.deleteWhatsappDemoVisitor(null, { id }, ctx)).resolves.toBe(true);
    expect(await WhatsappDemoVisitorModel.countDocuments()).toBe(0);
  });

  it('lets a platform administrator in from above the companies', async () => {
    const ctx = staff([ROLES.SUPER_ADMIN], null);

    const stats = await runAsPlatform(() => Query.whatsappDemoVisitorStats(null, null, ctx));

    expect(stats.total).toBe(0);
  });

  it('keeps other companies and signed-out callers out', async () => {
    const visitor = await seedVisitor();
    const outsider = staff([ROLES.ADMIN], new Types.ObjectId().toHexString());
    const id = visitor._id.toHexString();

    expect(await codeOf(Query.whatsappDemoVisitorsPaged(null, { input: page }, outsider))).toBe(
      'FORBIDDEN',
    );
    expect(await codeOf(Query.whatsappDemoVisitorStats(null, null, { user: null }))).toBe(
      'UNAUTHENTICATED',
    );
    expect(
      await codeOf(Mutation.setWhatsappDemoVisitorBlocked(null, { id, blocked: true }, outsider)),
    ).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.deleteWhatsappDemoVisitor(null, { id }, outsider))).toBe(
      'FORBIDDEN',
    );
    expect(await WhatsappDemoVisitorModel.countDocuments()).toBe(1);
  });
});

describe('public sign-in', () => {
  it('emails a code to anybody who asks and exchanges it for a pass', async () => {
    const input = { name: 'Dana', email: 'dana@acme.test', source: 'WEBSITE' as const };

    await expect(Mutation.requestWhatsappDemoCode(null, { input }, { user: null })).resolves.toBe(
      true,
    );
    const code: string = send.mock.calls[0][0].variables.code;
    const signIn = await Mutation.verifyWhatsappDemoCode(null, { email: 'dana@acme.test', code });

    await expect(visitorForPass(signIn.token)).resolves.toEqual(
      expect.objectContaining({ email: 'dana@acme.test', organizationId: operatorId }),
    );
  });

  it('passes the website security question on with the request', async () => {
    const input = { name: 'Dana', email: 'dana@acme.test', source: 'WEBSITE' as const };
    const ctx: GraphQLContext = { user: null, ip: 'website-server' };

    await expect(
      Mutation.requestWhatsappDemoCode(null, { input, captcha: solvedCaptcha() }, ctx),
    ).resolves.toBe(true);
    const spent = { ...solvedCaptcha(), answer: 'nope' };
    expect(
      await codeOf(Mutation.requestWhatsappDemoCode(null, { input, captcha: spent }, ctx)),
    ).toBe('CAPTCHA_FAILED');
  });

  it('limits the demo own sign-in per network', async () => {
    const ctx: GraphQLContext = { user: null, ip: 'test-network' };
    for (let i = 0; i < 20; i += 1) {
      const input = { name: 'Dana', email: `dana${i}@acme.test`, source: 'DEMO_LOGIN' as const };
      await Mutation.requestWhatsappDemoCode(null, { input, captcha: null }, ctx);
    }

    const input = { name: 'Dana', email: 'late@acme.test', source: 'DEMO_LOGIN' as const };
    expect(await codeOf(Mutation.requestWhatsappDemoCode(null, { input }, ctx))).toBe(
      'TOO_MANY_REQUESTS',
    );
  });

  it('describes the visitor pass and its header', () => {
    expect(VISITOR_HEADER).toBe('x-demo-visitor');
    expect(whatsappDemoVisitorTypeDefs.kind).toBe('Document');
  });
});
