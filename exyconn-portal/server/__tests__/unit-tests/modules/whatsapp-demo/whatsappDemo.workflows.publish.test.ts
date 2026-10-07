import { Types } from 'mongoose';
import {
  createWorkflow,
  discardDraft,
  duplicate,
  publish,
  remove,
  saveDraft,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.workflows';
import { WhatsappWorkflowModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import {
  END_GRAPH,
  NO_START_GRAPH,
  createDemo,
  draftInput,
  jumpGraph,
  signedInAdmin,
} from './workflowFixtures';

let ctx: GraphQLContext;
let demoId: string;

/** A workflow of the demo whose draft is `graph`. */
async function workflowWith(key: string, graph: unknown = END_GRAPH) {
  const created = await createWorkflow(ctx, {
    demoId,
    key,
    name: key,
    description: '',
    keywords: [],
  });
  await saveDraft(ctx, created.id, draftInput({ graph }));
  return created.id;
}

beforeAll(async () => {
  await WhatsappWorkflowModel.init();
});

beforeEach(async () => {
  ctx = await signedInAdmin();
  demoId = await createDemo();
});

describe('publishing a workflow', () => {
  it('makes the draft live and raises the version each time', async () => {
    const id = await workflowWith('booking');
    const first = await publish(ctx, id);
    expect(first).toMatchObject({ version: 1, status: 'PUBLISHED', published: END_GRAPH });
    expect(first.publishedAt).not.toBeNull();
    expect((await publish(ctx, id)).version).toBe(2);
    const audit = await AuditLogModel.findOne({ summary: /^Published version 1/ }).lean();
    expect(audit?.summary).toBe('Published version 1 of WhatsApp workflow salon/booking');
  });

  it('refuses a stored draft that is not a graph', async () => {
    const id = await workflowWith('booking');
    await WhatsappWorkflowModel.updateOne({ _id: id }, { draft: { start: 'x' } });
    await expect(publish(ctx, id)).rejects.toThrow('The draft is not valid.');
  });

  it('refuses a graph with errors, naming them', async () => {
    const id = await workflowWith('booking', NO_START_GRAPH);
    await expect(publish(ctx, id)).rejects.toThrow('The workflow has no start node.');
    expect((await WhatsappWorkflowModel.findById(id).lean())?.version).toBe(0);
  });

  it('refuses a jump to a workflow the chat cannot run yet', async () => {
    await workflowWith('faq');
    const id = await workflowWith('booking', jumpGraph('faq'));
    await expect(publish(ctx, id)).rejects.toThrow('There is no workflow "faq" to jump to.');
  });

  it('allows a jump to a published workflow of the demo, or to itself', async () => {
    await publish(ctx, await workflowWith('faq'));
    const toFaq = await workflowWith('booking', jumpGraph('faq'));
    await expect(publish(ctx, toFaq)).resolves.toMatchObject({ status: 'PUBLISHED' });
    const toSelf = await workflowWith('loop', jumpGraph('loop'));
    await expect(publish(ctx, toSelf)).resolves.toMatchObject({ version: 1 });
  });

  it('refuses a workflow that does not exist', async () => {
    expect(await codeOf(publish(ctx, new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });
});

describe('discarding a draft', () => {
  it('puts the live graph back into the draft', async () => {
    const id = await workflowWith('booking');
    await publish(ctx, id);
    await saveDraft(ctx, id, draftInput({ graph: jumpGraph('booking') }));
    const restored = await discardDraft(ctx, id);
    expect(restored).toMatchObject({ status: 'PUBLISHED', draft: END_GRAPH });
    const audit = await AuditLogModel.findOne({ summary: /^Discarded/ }).lean();
    expect(audit?.summary).toBe('Discarded the draft of WhatsApp workflow salon/booking');
  });

  it('refuses a workflow that has never been published', async () => {
    const id = await workflowWith('booking');
    await expect(discardDraft(ctx, id)).rejects.toThrow(
      'This workflow has never been published, so there is nothing to go back to.',
    );
  });
});

describe('duplicating a workflow', () => {
  it('copies the draft under the first free key, after the last workflow, unpublished', async () => {
    const id = await workflowWith('booking', jumpGraph('booking'));
    await publish(ctx, id);
    await workflowWith('faq');
    const copy = await duplicate(ctx, id);
    expect(copy).toMatchObject({
      key: 'booking-copy',
      demoKey: 'salon',
      draft: jumpGraph('booking'),
      version: 0,
      published: null,
      status: 'DRAFT',
      order: 4,
    });
    expect((await duplicate(ctx, id)).key).toBe('booking-copy-2');
    expect((await duplicate(ctx, id)).key).toBe('booking-copy-3');
    const audit = await AuditLogModel.findOne({ summary: /as booking-copy$/ }).lean();
    expect(audit?.summary).toBe('Duplicated WhatsApp workflow salon/booking as booking-copy');
  });
});

describe('deleting a workflow', () => {
  it('removes it and audits the delete', async () => {
    const id = await workflowWith('booking');
    await expect(remove(ctx, id)).resolves.toBe(true);
    expect(await WhatsappWorkflowModel.countDocuments()).toBe(0);
    const audit = await AuditLogModel.findOne({ action: 'DELETE' }).lean();
    expect(audit?.summary).toBe('Deleted WhatsApp workflow salon/booking');
  });

  it('refuses a workflow that does not exist', async () => {
    expect(await codeOf(remove(ctx, 'nope'))).toBe('NOT_FOUND');
  });
});
