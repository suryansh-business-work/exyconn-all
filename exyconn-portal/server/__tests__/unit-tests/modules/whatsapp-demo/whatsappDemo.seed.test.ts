import { Types } from 'mongoose';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import {
  ensureWhatsappDemoSeeds,
  ensureWhatsappDemoSeedsLazily,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.seed';
import {
  WhatsappDemoModel,
  WhatsappWorkflowModel,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import { MigrationModel } from '../../../../src/lib/migrations';
import { runForOrganization } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';

// Two real industries keep the suite quick while exercising the real seed content.
jest.mock('@exyconn/wa-flow/seeds', () => {
  const actual =
    jest.requireActual<typeof import('@exyconn/wa-flow/seeds')>('@exyconn/wa-flow/seeds');
  return { SEED_DEMOS: actual.SEED_DEMOS.slice(0, 2) };
});

const [first, second] = SEED_DEMOS;
const workflowCount = first.workflows.length + second.workflows.length;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('seeding the default industries', () => {
  it('writes each industry once, live, with a ledger line each', async () => {
    await ensureWhatsappDemoSeeds();
    const demos = await WhatsappDemoModel.find().sort({ order: 1 }).lean();
    expect(demos.map((demo) => demo.key)).toEqual([first.key, second.key]);
    expect(demos.map((demo) => demo.order)).toEqual([0, 1]);
    const workflows = await WhatsappWorkflowModel.find({ demoId: String(demos[0]._id) }).lean();
    expect(workflows).toHaveLength(first.workflows.length);
    expect(workflows.every((wf) => wf.version === 1 && wf.demoKey === first.key)).toBe(true);
    expect(workflows.every((wf) => JSON.stringify(wf.draft) === JSON.stringify(wf.published))).toBe(
      true,
    );
    const ledger = await MigrationModel.find().lean();
    expect(ledger.map((line) => line.name).sort((a, b) => a.localeCompare(b))).toEqual(
      [`whatsapp-demo-seed:${first.key}`, `whatsapp-demo-seed:${second.key}`].sort((a, b) =>
        a.localeCompare(b),
      ),
    );
  });

  it('never writes a seeded industry again, even after an admin deletes from it', async () => {
    await ensureWhatsappDemoSeeds();
    await WhatsappWorkflowModel.deleteMany({});
    await ensureWhatsappDemoSeeds();
    expect(await WhatsappDemoModel.countDocuments()).toBe(2);
    expect(await WhatsappWorkflowModel.countDocuments()).toBe(0);
  });

  it('leaves alone a demo an admin already made with the same key', async () => {
    await WhatsappDemoModel.create({
      key: first.key,
      industry: 'Hand made',
      business: { name: 'Own' },
      greeting: 'Hi',
      menuText: 'Menu',
      menuButton: 'Open',
    });
    await ensureWhatsappDemoSeeds();
    const own = await WhatsappDemoModel.findOne({ key: first.key }).lean();
    expect(own?.industry).toBe('Hand made');
    expect(await WhatsappWorkflowModel.countDocuments({ demoId: String(own?._id) })).toBe(0);
    expect(await WhatsappWorkflowModel.countDocuments()).toBe(second.workflows.length);
  });

  it('leaves nothing half-seeded when the workflows cannot be written, and retries later', async () => {
    jest
      .spyOn(WhatsappWorkflowModel, 'insertMany')
      .mockRejectedValueOnce(new Error('disk full') as never);
    await expect(ensureWhatsappDemoSeeds()).rejects.toThrow('disk full');
    expect(await WhatsappDemoModel.countDocuments()).toBe(0);
    expect(await MigrationModel.countDocuments()).toBe(0);

    await ensureWhatsappDemoSeeds();
    expect(await WhatsappWorkflowModel.countDocuments()).toBe(workflowCount);
  });

  it('lets a concurrent seed that lost the race on a unique key pass quietly', async () => {
    jest.spyOn(WhatsappDemoModel, 'create').mockRejectedValueOnce({ code: 11000 } as never);
    await expect(ensureWhatsappDemoSeeds()).resolves.toBeUndefined();
    expect(await WhatsappDemoModel.findOne({ key: second.key })).not.toBeNull();
  });
});

describe('seeding a company on its first read', () => {
  it('does nothing outside a company', async () => {
    await ensureWhatsappDemoSeedsLazily();
    expect(await WhatsappDemoModel.countDocuments()).toBe(0);
  });

  it("seeds the caller's company once per process", async () => {
    const organizationId = new Types.ObjectId().toHexString();
    await runForOrganization(organizationId, () => ensureWhatsappDemoSeedsLazily());
    const exists = jest.spyOn(WhatsappDemoModel, 'exists');
    await runForOrganization(organizationId, () => ensureWhatsappDemoSeedsLazily());
    expect(exists).not.toHaveBeenCalled();
    const own = await runForOrganization(organizationId, () => WhatsappDemoModel.countDocuments());
    expect(own).toBe(2);
    const elsewhere = new Types.ObjectId().toHexString();
    expect(await runForOrganization(elsewhere, () => WhatsappDemoModel.countDocuments())).toBe(0);
  });

  it('logs a failure and tries again on the next read', async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const error = jest.spyOn(logger, 'error');
    jest
      .spyOn(WhatsappDemoModel, 'exists')
      .mockRejectedValueOnce(new Error('database unavailable'));
    await runForOrganization(organizationId, () => ensureWhatsappDemoSeedsLazily());
    expect(error).toHaveBeenCalledWith(expect.anything(), 'WhatsApp demo seed failed');
    expect(await WhatsappDemoModel.countDocuments()).toBe(0);

    await runForOrganization(organizationId, () => ensureWhatsappDemoSeedsLazily());
    expect(await WhatsappDemoModel.countDocuments()).toBe(2);
  });
});
