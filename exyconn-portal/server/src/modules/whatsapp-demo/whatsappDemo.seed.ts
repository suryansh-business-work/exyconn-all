import { toDemoProfile, toWorkflowDef } from '@exyconn/wa-flow';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import type { SeedDemo } from '@exyconn/wa-flow';
import { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
import { isDuplicateKey } from './whatsappDemo.validation';
import { runOnce } from '../../lib/migrations';
import { currentOrganizationId } from '../../lib/tenant';
import { logger } from '../../utils/logger';

/**
 * The default industries, copied into a company's database once each.
 *
 * Every seed industry has its own ledger line (`whatsapp-demo-seed:<key>`), recorded per
 * company. So an industry added to @exyconn/wa-flow later is picked up on the next boot, and
 * one that has been seeded is never written again — not even when an admin has since deleted
 * workflows from it, because from the first seed on the database is the truth.
 *
 * A demo whose key already exists (an admin created one by hand) is left alone.
 */
async function seedDemo(seed: SeedDemo, order: number): Promise<void> {
  if (await WhatsappDemoModel.exists({ key: seed.key })) {
    return;
  }
  const demo = await WhatsappDemoModel.create(toDemoProfile(seed, order));
  const demoId = demo._id.toHexString();
  const now = new Date();
  const workflows = seed.workflows.map((workflow, index) => {
    const def = toWorkflowDef(workflow, index);
    return {
      demoId,
      demoKey: demo.key,
      key: def.key,
      name: def.name,
      description: def.description,
      keywords: def.keywords,
      order: def.order,
      // Seeds ship live: version 1, with the draft equal to what is published.
      draft: def.graph,
      published: def.graph,
      version: 1,
      publishedAt: now,
    };
  });
  try {
    await WhatsappWorkflowModel.insertMany(workflows);
  } catch (error) {
    // Leave nothing half-seeded: the ledger line is not written, so the next boot retries
    // from scratch, and it would skip a demo row left behind here.
    await WhatsappWorkflowModel.deleteMany({ demoId });
    await WhatsappDemoModel.deleteOne({ _id: demo._id });
    throw error;
  }
}

/** Seeds every industry this company has not had yet. Runs inside one company's scope. */
export async function ensureWhatsappDemoSeeds(): Promise<void> {
  for (const [index, seed] of SEED_DEMOS.entries()) {
    try {
      await runOnce(`whatsapp-demo-seed:${seed.key}`, () => seedDemo(seed, index));
    } catch (error) {
      // Two requests seeding one company at once: the loser's insert hits the unique key and
      // the winner's rows stand. Anything else retries on the next boot.
      if (!isDuplicateKey(error)) {
        throw error;
      }
    }
  }
}

/** Companies this process has already seeded, so a catalog read costs nothing after the first. */
const seeded = new Map<string, Promise<void>>();

/**
 * Seeds the caller's company on its first read in this process — a company created after
 * boot gets the demos without waiting for a restart. A failure is logged and forgotten, so
 * the next read tries again; the chat still opens with whatever exists.
 */
export async function ensureWhatsappDemoSeedsLazily(): Promise<void> {
  const organizationId = currentOrganizationId();
  if (!organizationId) {
    return;
  }
  let pending = seeded.get(organizationId);
  if (!pending) {
    pending = ensureWhatsappDemoSeeds().catch((error: unknown) => {
      seeded.delete(organizationId);
      logger.error({ err: error }, 'WhatsApp demo seed failed');
    });
    seeded.set(organizationId, pending);
  }
  await pending;
}
