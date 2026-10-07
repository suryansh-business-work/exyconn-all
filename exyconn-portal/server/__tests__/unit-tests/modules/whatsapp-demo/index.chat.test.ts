import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { toDemoProfile } from '@exyconn/wa-flow';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import {
  WhatsappDemoEventModel,
  WhatsappDemoModel,
  WhatsappDemoSessionModel,
  whatsappDemoResolvers,
} from '../../../../src/modules/whatsapp-demo';
import { runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { DemoVisitor } from '../../../../src/modules/whatsapp-demo/visitor/visitor.service';
import { codeOf } from '../codeOf';
import { signedInAdmin } from './workflowFixtures';

// The default industries are covered by their own suite; here the catalogue holds only what a test writes.
jest.mock('../../../../src/modules/whatsapp-demo/whatsappDemo.seed', () => ({
  ensureWhatsappDemoSeeds: async () => undefined,
  ensureWhatsappDemoSeedsLazily: async () => undefined,
}));

const { Query, Mutation } = whatsappDemoResolvers;
const demoOrg = new Types.ObjectId().toHexString();

const visitor: DemoVisitor = {
  id: 'v-1',
  name: 'Vera Visitor',
  email: 'vera@example.com',
  phone: '',
  company: 'Acme',
  organizationId: demoOrg,
};
const asVisitor: GraphQLContext = { user: null, demoVisitor: visitor };
const nobody: GraphQLContext = { user: null };
const outsider: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [], email: 'outsider@example.com' },
};

const demo = (key: string) => WhatsappDemoModel.create({ ...toDemoProfile(SEED_DEMOS[0], 0), key });

const stepEvent = (sessionId: string) => ({
  id: randomUUID(),
  sessionId,
  type: 'SESSION_START' as const,
  at: '2026-10-01T10:00:00.000Z',
});

describe('who may chat', () => {
  // The guard runs before any promise exists, so each call is made inside one.
  const settle = (call: () => Promise<unknown>) => codeOf(Promise.resolve().then(call));

  it('refuses somebody who is not signed in', async () => {
    expect(await settle(() => Query.whatsappDemoCatalog(null, {}, nobody))).toBe('UNAUTHENTICATED');
    expect(
      await settle(() => Mutation.recordWhatsappDemoEvents(null, { events: [] }, nobody)),
    ).toBe('UNAUTHENTICATED');
  });

  it('refuses a signed-in user without the employee role', async () => {
    expect(await settle(() => Query.whatsappDemoAiStatus(null, {}, outsider))).toBe('FORBIDDEN');
  });

  it('shows an employee the catalogue', async () => {
    await demo('salon');
    const employee = await signedInAdmin();
    const bundles = await Query.whatsappDemoCatalog(null, {}, employee);
    expect(bundles.map((bundle) => bundle.demo.key)).toEqual(['salon']);
  });

  it('shows a demo visitor only the catalogue of the company that owns the demos', async () => {
    await runForOrganization(demoOrg, () => demo('salon'));
    await runForOrganization(new Types.ObjectId().toHexString(), () => demo('clinic'));
    const bundles = await Query.whatsappDemoCatalog(null, {}, asVisitor);
    expect(bundles.map((bundle) => bundle.demo.key)).toEqual(['salon']);
  });

  it('tells a visitor whether the AI parse is available', async () => {
    await expect(Query.whatsappDemoAiStatus(null, {}, asVisitor)).resolves.toEqual({
      configured: false,
      model: null,
    });
  });
});

describe('what the chat records', () => {
  it("records a visitor's events against the visitor, inside the demo company", async () => {
    const stored = await Mutation.recordWhatsappDemoEvents(
      null,
      { events: [stepEvent('visit-1')] },
      asVisitor,
    );
    expect(stored).toBe(1);
    const session = await runForOrganization(demoOrg, () =>
      WhatsappDemoSessionModel.findOne({ sessionId: 'visit-1' }).lean(),
    );
    expect(session).toMatchObject({
      userId: 'visitor:v-1',
      userName: 'Vera Visitor',
      userEmail: 'vera@example.com',
    });
  });

  it("records an employee's events under their own name, even with a visitor pass", async () => {
    const employee = await signedInAdmin();
    const both: GraphQLContext = { ...employee, demoVisitor: visitor };
    await Mutation.recordWhatsappDemoEvents(null, { events: [stepEvent('work-1')] }, both);
    const session = await WhatsappDemoSessionModel.findOne({ sessionId: 'work-1' }).lean();
    expect(session).toMatchObject({ userId: employee.user?.id, userName: 'Asha Admin' });
  });

  it('reads free text for a visitor and records the outcome against them', async () => {
    const result = await Mutation.whatsappDemoParse(
      null,
      {
        input: {
          sessionId: 'visit-2',
          demoKey: 'salon',
          workflow: 'booking',
          node: 'ask',
          text: 'kal 5 baje',
          intents: [],
          entities: [],
        },
      },
      asVisitor,
    );
    expect(result).toMatchObject({ ok: false, error: 'NOT_CONFIGURED' });
    const call = await runForOrganization(demoOrg, () =>
      WhatsappDemoEventModel.findOne({ type: 'AI_CALL' }).lean(),
    );
    expect(call?.userId).toBe('visitor:v-1');
  });
});
