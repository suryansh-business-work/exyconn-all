import { isValidObjectId } from 'mongoose';
import type { CallingBotScenarioRecord } from '@exyconn/calling-bot-demo-server';
import { runOnce } from '../../lib/migrations';
import { badRequest, notFound } from '../../utils/errors';
import { inSequence } from '../../utils/inSequence';
import { isDuplicateKey } from '../../../../../demos/whatsapp-demo/server/src/whatsappDemo.validation';
import { CallingBotScenarioModel } from './calling-bot.models';
import { SCENARIO_SEEDS, type ScenarioSeed } from './calling-bot.scenarios.seed';
import { ensureCallingBotFlows } from './calling-bot.flows.service';

/** What Tech > Demos > Calling bot > Examples sends for one example. */
export interface CallingBotScenarioInput {
  title: string;
  description: string;
  systemPrompt: string;
  greeting: string;
  /** Empty keeps the active config's language. */
  languageCode: string;
  enabled: boolean;
  order: number;
}

/** The demo's order: the Tech screen's `order`, then by title. */
const IN_ORDER = { order: 1, title: 1 } as const;

async function seedScenario(seed: ScenarioSeed, index: number): Promise<void> {
  await CallingBotScenarioModel.create({
    ...seed,
    languageCode: '',
    enabled: true,
    order: (index + 1) * 10,
  });
}

/**
 * Seeds the install's examples: each one once, by key, through the boot ledger — so an example
 * Tech edited or deleted is left as it is, and one added to SCENARIO_SEEDS in a later release
 * still arrives. Run as the platform: the demo belongs to the install, not to a company.
 */
export async function ensureCallingBotScenarios(): Promise<void> {
  // In order, stopping at the first real failure: a boot that cannot write must not keep seeding.
  await inSequence(SCENARIO_SEEDS, (seed, index) =>
    runOnce(`calling-bot-scenario:${seed.key}`, () => seedScenario(seed, index)).catch(
      (error: unknown) => {
        // Two servers booting at once: the loser's insert hits the unique key; the winner's row stands.
        if (!isDuplicateKey(error)) {
          throw error;
        }
      },
    ),
  );
  await ensureCallingBotFlows();
}

/** The calling bot's example calls: the Tech screen's CRUD and the demo's picker. */
export const callingBotScenarios = {
  /** Every example, for Tech. */
  list() {
    return CallingBotScenarioModel.find().sort(IN_ORDER).lean<CallingBotScenarioRecord[]>();
  },

  /** The examples a caller can pick on the demo. */
  listEnabled() {
    return CallingBotScenarioModel.find({ enabled: true })
      .select('title description languageCode')
      .sort(IN_ORDER)
      .lean<CallingBotScenarioRecord[]>();
  },

  /** The example a call asked for; it has to be one the demo offers. */
  async forCall(id: string) {
    const scenario = isValidObjectId(id)
      ? await CallingBotScenarioModel.findOne({
          _id: id,
          enabled: true,
        }).lean<CallingBotScenarioRecord>()
      : null;
    if (!scenario) {
      badRequest('That example is no longer offered. Pick another one.');
    }
    return scenario;
  },

  async create(input: CallingBotScenarioInput) {
    const created = await CallingBotScenarioModel.create(input);
    return created.toObject<CallingBotScenarioRecord>();
  },

  async update(id: string, input: CallingBotScenarioInput) {
    const doc = await CallingBotScenarioModel.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    }).lean<CallingBotScenarioRecord>();
    if (!doc) notFound('Calling bot example');
    return doc;
  },

  async remove(id: string) {
    const doc =
      await CallingBotScenarioModel.findByIdAndDelete(id).lean<CallingBotScenarioRecord>();
    if (!doc) notFound('Calling bot example');
    return doc;
  },
};
