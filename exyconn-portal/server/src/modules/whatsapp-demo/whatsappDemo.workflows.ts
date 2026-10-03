import { isValidObjectId } from 'mongoose';
import { graphSchema, isPublishable, validateGraph, workflowSchema } from '@exyconn/wa-flow';
import type { WaGraph } from '@exyconn/wa-flow';
import { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
import { presentWorkflow } from './whatsappDemo.present';
import { isDuplicateKey, refuseGraph, refuseZod } from './whatsappDemo.validation';
import { recordAudit, type AuditAction } from '../audit';
import { actorNameOf } from '../../lib/actor';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const MODULE = 'WhatsappWorkflow';

/** What a new workflow starts as: one End node that offers the menu again. */
const STARTER_GRAPH: WaGraph = {
  start: 'end',
  nodes: [{ id: 'end', type: 'end', position: { x: 0, y: 0 }, data: { showMenu: true } }],
  edges: [],
};

const metaSchema = workflowSchema.pick({
  key: true,
  name: true,
  description: true,
  keywords: true,
});
const draftSchema = workflowSchema.omit({ key: true });

export interface WorkflowCreateInput {
  demoId: string;
  key: string;
  name: string;
  description: string;
  keywords: string[];
  order?: number | null;
}

export interface WorkflowDraftInput {
  name: string;
  description: string;
  keywords: string[];
  order: number;
  graph: unknown;
}

async function load(id: string) {
  const doc = isValidObjectId(id) ? await WhatsappWorkflowModel.findById(id).lean() : null;
  if (!doc) {
    notFound('WhatsApp workflow');
  }
  return doc;
}

async function stamp(ctx: GraphQLContext) {
  return { updatedById: ctx.user?.id ?? null, updatedByName: await actorNameOf(ctx) };
}

async function audit(
  ctx: GraphQLContext,
  action: AuditAction,
  doc: { _id: unknown; key: string },
  summary: string,
) {
  await recordAudit(ctx, {
    action,
    module: MODULE,
    entityId: doc._id,
    entityLabel: doc.key,
    summary,
  });
}

/** Writes `update` onto a workflow and returns it as the API shows it. */
async function save(id: string, update: Record<string, unknown>) {
  const doc = await WhatsappWorkflowModel.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!doc) {
    notFound('WhatsApp workflow');
  }
  return presentWorkflow(doc);
}

export async function listWorkflows(demoId?: string | null) {
  const filter = demoId ? { demoId } : {};
  const docs = await WhatsappWorkflowModel.find(filter)
    .sort({ demoKey: 1, order: 1, key: 1 })
    .lean();
  return docs.map(presentWorkflow);
}

export async function getWorkflow(id: string) {
  const doc = isValidObjectId(id) ? await WhatsappWorkflowModel.findById(id).lean() : null;
  return doc ? presentWorkflow(doc) : null;
}

export async function createWorkflow(ctx: GraphQLContext, input: WorkflowCreateInput) {
  const parsed = metaSchema.safeParse(input);
  if (!parsed.success) {
    refuseZod('The workflow is not valid.', parsed.error);
  }
  const demo = isValidObjectId(input.demoId)
    ? await WhatsappDemoModel.findById(input.demoId).lean()
    : null;
  if (!demo) {
    notFound('WhatsApp demo');
  }
  const last = await WhatsappWorkflowModel.findOne({ demoId: input.demoId })
    .sort({ order: -1 })
    .lean();
  const order = input.order ?? (last ? last.order + 1 : 0);
  try {
    const created = await WhatsappWorkflowModel.create({
      ...parsed.data,
      demoId: input.demoId,
      demoKey: demo.key,
      order,
      draft: STARTER_GRAPH,
      ...(await stamp(ctx)),
    });
    await audit(ctx, 'CREATE', created, `Created WhatsApp workflow ${demo.key}/${created.key}`);
    return presentWorkflow(created.toObject());
  } catch (error) {
    if (isDuplicateKey(error)) {
      badRequest(`This demo already has a workflow with the key "${input.key}".`);
    }
    throw error;
  }
}

export async function saveDraft(ctx: GraphQLContext, id: string, input: WorkflowDraftInput) {
  const before = await load(id);
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) {
    refuseZod('The draft is not valid.', parsed.error);
  }
  const { graph, ...meta } = parsed.data;
  const result = await save(id, { ...meta, draft: graph, ...(await stamp(ctx)) });
  await audit(
    ctx,
    'UPDATE',
    before,
    `Saved the draft of WhatsApp workflow ${before.demoKey}/${before.key}`,
  );
  return result;
}

/**
 * Makes the draft live. On top of the shape check, the graph must make sense as a
 * conversation, and every Jump must land on a workflow the chat can actually run — one
 * already published in this demo, or this one.
 */
export async function publish(ctx: GraphQLContext, id: string) {
  const doc = await load(id);
  const shape = graphSchema.safeParse(doc.draft);
  if (!shape.success) {
    refuseZod('The draft is not valid.', shape.error);
  }
  const live = await WhatsappWorkflowModel.find({ demoId: doc.demoId, version: { $gt: 0 } })
    .select('key')
    .lean();
  const keys = [...new Set([doc.key, ...live.map((wf) => wf.key)])];
  const issues = validateGraph(shape.data, keys);
  if (!isPublishable(issues)) {
    refuseGraph(issues);
  }
  const result = await save(id, {
    published: shape.data,
    draft: shape.data,
    $inc: { version: 1 },
    publishedAt: new Date(),
    ...(await stamp(ctx)),
  });
  await audit(
    ctx,
    'UPDATE',
    doc,
    `Published version ${result.version} of WhatsApp workflow ${doc.demoKey}/${doc.key}`,
  );
  return result;
}

export async function discardDraft(ctx: GraphQLContext, id: string) {
  const doc = await load(id);
  if (!doc.published) {
    badRequest('This workflow has never been published, so there is nothing to go back to.');
  }
  const result = await save(id, { draft: doc.published, ...(await stamp(ctx)) });
  await audit(
    ctx,
    'UPDATE',
    doc,
    `Discarded the draft of WhatsApp workflow ${doc.demoKey}/${doc.key}`,
  );
  return result;
}

/** The first free `<key>-copy`, `<key>-copy-2`, … in the demo. */
async function copyKey(demoId: string, key: string): Promise<string> {
  const taken = new Set(
    (await WhatsappWorkflowModel.find({ demoId }).select('key').lean()).map((wf) => wf.key),
  );
  const base = `${key}-copy`;
  let candidate = base;
  for (let n = 2; taken.has(candidate); n += 1) {
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function duplicate(ctx: GraphQLContext, id: string) {
  const doc = await load(id);
  const last = await WhatsappWorkflowModel.findOne({ demoId: doc.demoId })
    .sort({ order: -1 })
    .lean();
  const created = await WhatsappWorkflowModel.create({
    demoId: doc.demoId,
    demoKey: doc.demoKey,
    key: await copyKey(doc.demoId, doc.key),
    name: doc.name,
    description: doc.description,
    keywords: doc.keywords,
    order: (last?.order ?? doc.order) + 1,
    draft: doc.draft,
    ...(await stamp(ctx)),
  });
  await audit(
    ctx,
    'CREATE',
    created,
    `Duplicated WhatsApp workflow ${doc.demoKey}/${doc.key} as ${created.key}`,
  );
  return presentWorkflow(created.toObject());
}

export async function remove(ctx: GraphQLContext, id: string): Promise<boolean> {
  const doc = await load(id);
  // The bundle revision hashes the published workflows, so the chat notices this is gone.
  await WhatsappWorkflowModel.deleteOne({ _id: doc._id });
  await audit(ctx, 'DELETE', doc, `Deleted WhatsApp workflow ${doc.demoKey}/${doc.key}`);
  return true;
}
