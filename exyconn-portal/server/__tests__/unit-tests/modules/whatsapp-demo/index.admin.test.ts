import { Types } from 'mongoose';
import { toDemoProfile } from '@exyconn/wa-flow';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import { whatsappDemoResolvers, whatsappDemoTypeDefs } from '../../../../src/modules/whatsapp-demo';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { END_GRAPH, draftInput, signedInAdmin } from './workflowFixtures';

jest.mock('../../../../src/modules/whatsapp-demo/whatsappDemo.seed', () => ({
  ensureWhatsappDemoSeeds: async () => undefined,
  ensureWhatsappDemoSeedsLazily: async () => undefined,
}));

const { Query, Mutation } = whatsappDemoResolvers;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles, email: 'caller@example.com' },
});
const employee = as([ROLES.EMPLOYEE]);
const range = { from: '2026-10-01', to: '2026-10-02' };
const id = { id: new Types.ObjectId().toHexString() };

describe('the WhatsApp demo schema', () => {
  it('declares the operations the resolvers answer', () => {
    const source = whatsappDemoTypeDefs.loc?.source.body ?? '';
    for (const name of [...Object.keys(Query), ...Object.keys(Mutation)]) {
      expect(source).toContain(name);
    }
  });
});

describe('who may administer the demo', () => {
  const adminOnly: [string, (ctx: GraphQLContext) => unknown][] = [
    ['whatsappDemos', (ctx) => Query.whatsappDemos(null, {}, ctx)],
    ['whatsappWorkflows', (ctx) => Query.whatsappWorkflows(null, {}, ctx)],
    ['whatsappWorkflow', (ctx) => Query.whatsappWorkflow(null, id, ctx)],
    ['whatsappDemoStats', (ctx) => Query.whatsappDemoStats(null, range, ctx)],
    [
      'whatsappDemoFunnel',
      (ctx) =>
        Query.whatsappDemoFunnel(null, { ...range, demoKey: 'salon', workflow: 'booking' }, ctx),
    ],
    [
      'whatsappDemoSessions',
      (ctx) => Query.whatsappDemoSessions(null, { input: { page: 0, pageSize: 10 } }, ctx),
    ],
    ['whatsappDemoSession', (ctx) => Query.whatsappDemoSession(null, { sessionId: 's' }, ctx)],
    ['publishWhatsappWorkflow', (ctx) => Mutation.publishWhatsappWorkflow(null, id, ctx)],
    ['discardWhatsappWorkflowDraft', (ctx) => Mutation.discardWhatsappWorkflowDraft(null, id, ctx)],
    ['duplicateWhatsappWorkflow', (ctx) => Mutation.duplicateWhatsappWorkflow(null, id, ctx)],
    ['deleteWhatsappWorkflow', (ctx) => Mutation.deleteWhatsappWorkflow(null, id, ctx)],
  ];

  it.each(adminOnly)('%s refuses an employee', async (_name, call) => {
    // The guard runs before any promise exists, so the call is made inside one.
    expect(await codeOf(Promise.resolve().then(() => call(employee)))).toBe('FORBIDDEN');
  });

  it("lets the platform's super admin read the company's analytics", async () => {
    const stats = await Query.whatsappDemoStats(null, range, as([ROLES.SUPER_ADMIN]));
    expect(stats).toMatchObject({
      sessions: 0,
      daily: [{ date: '2026-10-01' }, { date: '2026-10-02' }],
    });
  });

  it('answers the analytics reads for an admin', async () => {
    const admin = as([ROLES.ADMIN]);
    await expect(
      Query.whatsappDemoFunnel(null, { ...range, demoKey: 'salon', workflow: 'booking' }, admin),
    ).resolves.toEqual([]);
    await expect(
      Query.whatsappDemoSessions(null, { input: { page: 0, pageSize: 10 }, ...range }, admin),
    ).resolves.toEqual({ rows: [], totalCount: 0 });
    await expect(Query.whatsappDemoSession(null, { sessionId: 'none' }, admin)).resolves.toBeNull();
  });
});

describe('editing the demo through the API', () => {
  it('takes a workflow from creation through publish, copy, discard and delete', async () => {
    const admin = await signedInAdmin();
    const demo = await Mutation.upsertWhatsappDemo(
      null,
      { input: { ...toDemoProfile(SEED_DEMOS[0], 0), key: 'salon' } },
      admin,
    );
    expect((await Query.whatsappDemos(null, {}, admin)).map((row) => row.key)).toEqual(['salon']);

    const created = await Mutation.createWhatsappWorkflow(
      null,
      { input: { demoId: demo.id, key: 'booking', name: 'Book', description: '', keywords: [] } },
      admin,
    );
    const saved = await Mutation.saveWhatsappWorkflowDraft(
      null,
      { id: created.id, input: draftInput() },
      admin,
    );
    expect(saved.name).toBe('Book a slot');

    const published = await Mutation.publishWhatsappWorkflow(null, { id: created.id }, admin);
    expect(published).toMatchObject({ version: 1, status: 'PUBLISHED', published: END_GRAPH });

    const copy = await Mutation.duplicateWhatsappWorkflow(null, { id: created.id }, admin);
    expect(copy.key).toBe('booking-copy');
    const listed = await Query.whatsappWorkflows(null, { demoId: demo.id }, admin);
    expect(listed.map((wf) => wf.key)).toEqual(['booking', 'booking-copy']);
    await expect(Query.whatsappWorkflow(null, { id: copy.id }, admin)).resolves.toMatchObject({
      status: 'DRAFT',
    });

    const restored = await Mutation.discardWhatsappWorkflowDraft(null, { id: created.id }, admin);
    expect(restored.status).toBe('PUBLISHED');
    await expect(Mutation.deleteWhatsappWorkflow(null, { id: copy.id }, admin)).resolves.toBe(true);
    await expect(Query.whatsappWorkflow(null, { id: copy.id }, admin)).resolves.toBeNull();
  });

  it('refuses an employee who tries to edit content', async () => {
    const input = { ...toDemoProfile(SEED_DEMOS[0], 0), key: 'salon' };
    expect(
      await codeOf(
        Promise.resolve().then(() => Mutation.upsertWhatsappDemo(null, { input }, employee)),
      ),
    ).toBe('FORBIDDEN');
    const workflowInput = { demoId: id.id, key: 'k', name: 'n', description: '', keywords: [] };
    expect(
      await codeOf(
        Promise.resolve().then(() =>
          Mutation.createWhatsappWorkflow(null, { input: workflowInput }, employee),
        ),
      ),
    ).toBe('FORBIDDEN');
    expect(
      await codeOf(
        Promise.resolve().then(() =>
          Mutation.saveWhatsappWorkflowDraft(null, { id: id.id, input: draftInput() }, employee),
        ),
      ),
    ).toBe('FORBIDDEN');
  });
});
