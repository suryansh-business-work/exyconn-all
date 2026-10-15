import { Schema, model } from 'mongoose';
import {
  CALLING_BOT_CALL_FIELDS,
  CALLING_BOT_CALL_MODEL,
  CALLING_BOT_CONFIG_FIELDS,
  CALLING_BOT_CONFIG_MODEL,
  CALLING_BOT_SCENARIO_FIELDS,
  CALLING_BOT_SCENARIO_MODEL,
} from '@exyconn/calling-bot-demo-server';

/**
 * The calling bot demo's records, built from the definitions its voice server shares
 * (demos/calling-bot-demo/server), so both read and write the same documents. Platform records
 * (lib/tenant/platform-models.ts): the demo belongs to the install, not to one company.
 * Read through `.lean<CallingBotConfigRecord>()`, `.lean<CallingBotCallRecord>()` and
 * `.lean<CallingBotScenarioRecord>()`.
 */
export const CallingBotConfigModel = model(
  CALLING_BOT_CONFIG_MODEL,
  new Schema(CALLING_BOT_CONFIG_FIELDS, { timestamps: true }),
);

export const CallingBotCallModel = model(
  CALLING_BOT_CALL_MODEL,
  new Schema(CALLING_BOT_CALL_FIELDS, { timestamps: true }),
);

/** The example calls a visitor picks from; a seeded one's `key` is unique, an added one has none. */
const scenarioSchema = new Schema(CALLING_BOT_SCENARIO_FIELDS, { timestamps: true });
scenarioSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $gt: '' } } });
scenarioSchema.index({ order: 1, title: 1 });

export const CallingBotScenarioModel = model(CALLING_BOT_SCENARIO_MODEL, scenarioSchema);
