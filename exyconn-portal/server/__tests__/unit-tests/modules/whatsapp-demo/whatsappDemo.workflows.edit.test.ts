import { Types } from 'mongoose';
import {
  createWorkflow,
  getWorkflow,
  listWorkflows,
  saveDraft,
  type WorkflowCreateInput,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.workflows';
import { WhatsappWorkflowModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { END_GRAPH, createDemo, draftInput, signedInAdmin } from './workflowFixtures';
import { asArg } from '../../../mockAs';

let ctx: GraphQLContext;
let demoId: string;

const createInput = (fields: Partial<WorkflowCreateInput> = {}): WorkflowCreateInput => ({
  demoId,
  key: 'booking',
  name: 'Book',
  description: '',
  keywords: ['book'],
  ...fields,
});

beforeAll(async () => {
  await WhatsappWorkflowModel.init();
});

beforeEach(async () => {
  ctx = await signedInAdmin();
  demoId = await createDemo();
});

describe('creating a workflow', () => {
  it('starts as an unpublished End node, stamped with who made it', async () => {
    const created = await createWorkflow(ctx, createInput());
    expect(created).toMatchObject({
      demoId,
      demoKey: 'salon',
      key: 'booking',
      order: 0,
      version: 0,
      status: 'DRAFT',
      published: null,
      draft: END_GRAPH,
      updatedByName: 'Asha Admin',
    });
    const audit = await AuditLogModel.findOne({ module: 'WhatsappWorkflow' }).lean();
    expect(audit).toMatchObject({
      action: 'CREATE',
      summary: 'Created WhatsApp workflow salon/booking',
    });
  });

  it('goes after the last workflow unless an order is given', async () => {
    await createWorkflow(ctx, createInput({ key: 'first' }));
    const second = await createWorkflow(ctx, createInput({ key: 'second' }));
    const placed = await createWorkflow(ctx, createInput({ key: 'placed', order: 7 }));
    expect(second.order).toBe(1);
    expect(placed.order).toBe(7);
  });

  it('refuses meta that is not valid', async () => {
    await expect(createWorkflow(ctx, createInput({ key: 'Bad Key', name: '' }))).rejects.toThrow(
      'The workflow is not valid.',
    );
  });

  it('refuses a demo that does not exist', async () => {
    expect(await codeOf(createWorkflow(ctx, createInput({ demoId: 'nope' })))).toBe('NOT_FOUND');
    const missing = new Types.ObjectId().toHexString();
    expect(await codeOf(createWorkflow(ctx, createInput({ demoId: missing })))).toBe('NOT_FOUND');
  });

  it('refuses a key the demo already uses', async () => {
    await createWorkflow(ctx, createInput());
    await expect(createWorkflow(ctx, createInput())).rejects.toThrow(
      'This demo already has a workflow with the key "booking".',
    );
  });

  it('allows the same key in another demo', async () => {
    await createWorkflow(ctx, createInput());
    const otherDemo = await createDemo('clinic');
    const other = await createWorkflow(ctx, createInput({ demoId: otherDemo }));
    expect(other).toMatchObject({ demoKey: 'clinic', key: 'booking' });
  });

  it('refuses to stamp a change with nobody signed in', async () => {
    expect(await codeOf(createWorkflow({ user: null }, createInput()))).toBe('UNAUTHENTICATED');
    expect(await WhatsappWorkflowModel.countDocuments()).toBe(0);
  });

  it('passes on a failure that is not a duplicate key', async () => {
    const create = jest
      .spyOn(WhatsappWorkflowModel, 'create')
      .mockRejectedValueOnce(new Error('disk full'));
    await expect(createWorkflow(ctx, createInput())).rejects.toThrow('disk full');
    create.mockRestore();
  });
});

describe('reading workflows', () => {
  it("lists one demo's workflows, or every one, by demo then order", async () => {
    const clinicId = await createDemo('clinic');
    await createWorkflow(ctx, createInput({ key: 'b-flow', order: 1 }));
    await createWorkflow(ctx, createInput({ key: 'a-flow', order: 1 }));
    await createWorkflow(ctx, createInput({ key: 'z-flow', order: 0 }));
    await createWorkflow(ctx, createInput({ demoId: clinicId, key: 'visit' }));

    expect((await listWorkflows(demoId)).map((wf) => wf.key)).toEqual([
      'z-flow',
      'a-flow',
      'b-flow',
    ]);
    expect((await listWorkflows(null)).map((wf) => wf.key)).toEqual([
      'visit',
      'z-flow',
      'a-flow',
      'b-flow',
    ]);
  });

  it('reads one workflow, or null when there is none', async () => {
    const created = await createWorkflow(ctx, createInput());
    await expect(getWorkflow(created.id)).resolves.toMatchObject({ key: 'booking' });
    await expect(getWorkflow('nope')).resolves.toBeNull();
    await expect(getWorkflow(new Types.ObjectId().toHexString())).resolves.toBeNull();
  });
});

describe('saving a draft', () => {
  it('saves the graph and meta without touching what is live', async () => {
    const created = await createWorkflow(ctx, createInput());
    const graph = { ...END_GRAPH, nodes: [{ ...END_GRAPH.nodes[0], data: { showMenu: false } }] };
    const saved = await saveDraft(ctx, created.id, draftInput({ graph, keywords: ['slot'] }));
    expect(saved).toMatchObject({
      name: 'Book a slot',
      description: 'Pick a time',
      keywords: ['slot'],
      order: 3,
      draft: graph,
      published: null,
      key: 'booking',
    });
    const audit = await AuditLogModel.findOne({ action: 'UPDATE' }).lean();
    expect(audit?.summary).toBe('Saved the draft of WhatsApp workflow salon/booking');
  });

  it('refuses a draft that is not valid', async () => {
    const created = await createWorkflow(ctx, createInput());
    const promise = saveDraft(
      ctx,
      created.id,
      draftInput({ graph: { start: '', nodes: [], edges: [] } }),
    );
    await expect(promise).rejects.toThrow('The draft is not valid.');
  });

  it('refuses a workflow that does not exist', async () => {
    expect(await codeOf(saveDraft(ctx, 'nope', draftInput()))).toBe('NOT_FOUND');
  });

  it('refuses a workflow deleted while it was being saved', async () => {
    const created = await createWorkflow(ctx, createInput());
    const update = jest
      .spyOn(WhatsappWorkflowModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));
    expect(await codeOf(saveDraft(ctx, created.id, draftInput()))).toBe('NOT_FOUND');
    update.mockRestore();
  });
});
