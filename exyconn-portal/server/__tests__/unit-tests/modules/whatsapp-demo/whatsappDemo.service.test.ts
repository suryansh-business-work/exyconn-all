import { Types } from 'mongoose';
import { toDemoProfile } from '@exyconn/wa-flow';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import {
  catalog,
  listDemos,
  upsertDemo,
  type WhatsappDemoInput,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.service';
import {
  WhatsappDemoModel,
  WhatsappWorkflowModel,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const ctx: GraphQLContext = {
  user: {
    id: new Types.ObjectId().toHexString(),
    roles: [ROLES.ADMIN],
    email: 'admin@example.com',
  },
};

const input = (fields: Partial<WhatsappDemoInput> = {}): WhatsappDemoInput => ({
  ...toDemoProfile(SEED_DEMOS[0], 0),
  key: 'salon',
  ...fields,
});

const graph = (start: string) => ({ start, nodes: [], edges: [] });

const workflow = (demoId: string, key: string, version: number, order = 0) =>
  WhatsappWorkflowModel.create({
    demoId,
    demoKey: 'salon',
    key,
    name: key,
    order,
    draft: graph(`${key}-draft`),
    published: version > 0 ? graph(`${key}-live`) : null,
    version,
  });

beforeAll(async () => {
  await WhatsappDemoModel.init();
});

describe('the catalogue the chat runs', () => {
  it('holds every active demo in order, with only its published workflows', async () => {
    const salon = await upsertDemo(ctx, null, input({ key: 'salon', order: 1 }));
    const clinic = await upsertDemo(ctx, null, input({ key: 'clinic', order: 0 }));
    await upsertDemo(ctx, null, input({ key: 'hidden', order: 0, active: false }));
    await workflow(salon.id, 'booking', 2, 1);
    await workflow(salon.id, 'faq', 1, 0);
    await workflow(salon.id, 'draft-only', 0, 2);

    const bundles = await catalog();
    expect(bundles.map((bundle) => bundle.demo.key)).toEqual(['clinic', 'salon']);
    const salonBundle = bundles[1];
    expect(salonBundle.workflows.map((wf) => wf.key)).toEqual(['faq', 'booking']);
    expect(salonBundle.workflows[1]).toMatchObject({ version: 2, graph: graph('booking-live') });
    expect(bundles[0].workflows).toEqual([]);
    expect(bundles[0].demo.id).toBe(clinic.id);
    expect(salonBundle.revision).toMatch(/^[0-9a-f]{16}$/);
  });

  it('changes a revision when a workflow is published again', async () => {
    const salon = await upsertDemo(ctx, null, input());
    const booking = await workflow(salon.id, 'booking', 1);
    const before = (await catalog())[0].revision;
    await WhatsappWorkflowModel.updateOne({ _id: booking._id }, { version: 2 });
    expect((await catalog())[0].revision).not.toBe(before);
  });

  it('lists every demo for the admins, inactive ones too', async () => {
    await upsertDemo(ctx, null, input({ key: 'b-demo', order: 1 }));
    await upsertDemo(ctx, null, input({ key: 'a-demo', order: 1, active: false }));
    await upsertDemo(ctx, null, input({ key: 'z-demo', order: 0 }));
    expect((await listDemos()).map((demo) => demo.key)).toEqual(['z-demo', 'a-demo', 'b-demo']);
  });
});

describe('creating and editing a demo', () => {
  it('creates a demo and audits it', async () => {
    const created = await upsertDemo(ctx, undefined, input());
    expect(created).toMatchObject({ key: 'salon', active: true, id: expect.any(String) });
    const audit = await AuditLogModel.findOne({ module: 'WhatsappDemo' }).lean();
    expect(audit).toMatchObject({ action: 'CREATE', entityLabel: 'salon', entityId: created.id });
  });

  it('refuses a demo that is not valid', async () => {
    const promise = upsertDemo(ctx, null, input({ key: 'Not A Slug', menuButton: '' }));
    await expect(promise).rejects.toThrow('The demo is not valid.');
    expect(await WhatsappDemoModel.countDocuments()).toBe(0);
  });

  it('refuses a second demo with the same key', async () => {
    await upsertDemo(ctx, null, input());
    await expect(upsertDemo(ctx, null, input())).rejects.toThrow(
      'A demo with the key "salon" already exists.',
    );
  });

  it('refuses to edit a demo that does not exist', async () => {
    expect(await codeOf(upsertDemo(ctx, 'not-an-id', input()))).toBe('NOT_FOUND');
    expect(await codeOf(upsertDemo(ctx, new Types.ObjectId().toHexString(), input()))).toBe(
      'NOT_FOUND',
    );
  });

  it('carries a changed key onto its workflows and audits what changed', async () => {
    const salon = await upsertDemo(ctx, null, input());
    await workflow(salon.id, 'booking', 1);
    const updated = await upsertDemo(ctx, salon.id, input({ key: 'spa', industry: 'Spa' }));
    expect(updated).toMatchObject({ id: salon.id, key: 'spa', industry: 'Spa' });
    const moved = await WhatsappWorkflowModel.findOne({ demoId: salon.id }).lean();
    expect(moved?.demoKey).toBe('spa');
    const audit = await AuditLogModel.findOne({ module: 'WhatsappDemo', action: 'UPDATE' }).lean();
    expect(audit?.summary).toBe('Updated WhatsApp demo spa');
    expect(audit?.changes).toContain('industry');
  });

  it('leaves the workflows alone when the key stays', async () => {
    const salon = await upsertDemo(ctx, null, input());
    const updateMany = jest.spyOn(WhatsappWorkflowModel, 'updateMany');
    await upsertDemo(ctx, salon.id, input({ greeting: 'Welcome back' }));
    expect(updateMany).not.toHaveBeenCalled();
    updateMany.mockRestore();
  });

  it('refuses an edit when the demo vanishes mid-way', async () => {
    const salon = await upsertDemo(ctx, null, input());
    const update = jest
      .spyOn(WhatsappDemoModel, 'findByIdAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);
    expect(await codeOf(upsertDemo(ctx, salon.id, input()))).toBe('NOT_FOUND');
    update.mockRestore();
  });

  it('passes on a failure that is not a duplicate key', async () => {
    const create = jest
      .spyOn(WhatsappDemoModel, 'create')
      .mockRejectedValueOnce(new Error('disk full') as never);
    await expect(upsertDemo(ctx, null, input())).rejects.toThrow('disk full');
    create.mockRestore();
  });
});
