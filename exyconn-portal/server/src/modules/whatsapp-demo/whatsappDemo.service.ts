import { isValidObjectId } from 'mongoose';
import { demoSchema } from '@exyconn/wa-flow';
import { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
import { bundleRevision, presentDemo, presentPublished } from './whatsappDemo.present';
import { isDuplicateKey, refuseZod } from './whatsappDemo.validation';
import { ensureWhatsappDemoSeedsLazily } from './whatsappDemo.seed';
import { recordAudit, diffChanges } from '../audit';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const MODULE = 'WhatsappDemo';

export interface WhatsappDemoInput {
  key: string;
  industry: string;
  business: unknown;
  greeting: string;
  menuText: string;
  menuButton: string;
  order: number;
  active: boolean;
}

/**
 * What the chat runs: every active demo with its PUBLISHED workflows only, so a draft an
 * admin is halfway through never reaches a customer.
 */
export async function catalog() {
  await ensureWhatsappDemoSeedsLazily();
  const demos = await WhatsappDemoModel.find({ active: true }).sort({ order: 1, key: 1 }).lean();
  const workflows = await WhatsappWorkflowModel.find({
    demoId: { $in: demos.map((demo) => String(demo._id)) },
    version: { $gt: 0 },
  })
    .sort({ order: 1, key: 1 })
    .lean();
  return demos.map((demo) => {
    const own = workflows.filter((wf) => wf.demoId === String(demo._id));
    return {
      demo: presentDemo(demo),
      workflows: own.map(presentPublished),
      revision: bundleRevision(demo, own),
    };
  });
}

export async function listDemos() {
  await ensureWhatsappDemoSeedsLazily();
  const demos = await WhatsappDemoModel.find().sort({ order: 1, key: 1 }).lean();
  return demos.map(presentDemo);
}

/** Creates a demo, or edits one; a changed key is carried onto its workflows. */
export async function upsertDemo(
  ctx: GraphQLContext,
  id: string | null | undefined,
  input: WhatsappDemoInput,
) {
  const parsed = demoSchema.safeParse(input);
  if (!parsed.success) {
    refuseZod('The demo is not valid.', parsed.error);
  }
  const values = parsed.data;
  try {
    if (!id) {
      const created = await WhatsappDemoModel.create(values);
      await recordAudit(ctx, {
        action: 'CREATE',
        module: MODULE,
        entityId: created._id,
        entityLabel: values.key,
        summary: `Created WhatsApp demo ${values.key}`,
      });
      return presentDemo(created.toObject());
    }
    if (!isValidObjectId(id)) {
      notFound('WhatsApp demo');
    }
    const before = await WhatsappDemoModel.findById(id).lean();
    if (!before) {
      notFound('WhatsApp demo');
    }
    const updated = await WhatsappDemoModel.findByIdAndUpdate(id, values, { new: true }).lean();
    if (!updated) {
      notFound('WhatsApp demo');
    }
    if (before.key !== values.key) {
      await WhatsappWorkflowModel.updateMany({ demoId: id }, { demoKey: values.key });
    }
    await recordAudit(ctx, {
      action: 'UPDATE',
      module: MODULE,
      entityId: id,
      entityLabel: values.key,
      summary: `Updated WhatsApp demo ${values.key}`,
      changes: diffChanges(before, values),
    });
    return presentDemo(updated);
  } catch (error) {
    if (isDuplicateKey(error)) {
      badRequest(`A demo with the key "${values.key}" already exists.`);
    }
    throw error;
  }
}
