import mongoose, { Schema } from 'mongoose';
import {
  CALLING_BOT_CALL_FIELDS,
  CALLING_BOT_CALL_MODEL,
  CALLING_BOT_CONFIG_FIELDS,
  CALLING_BOT_CONFIG_MODEL,
} from '../index';
import { env } from './env';

/** Read through `.lean<CallingBotConfigRecord>()`: the record type lives with the field definitions. */
export const ConfigModel = mongoose.model(
  CALLING_BOT_CONFIG_MODEL,
  new Schema(CALLING_BOT_CONFIG_FIELDS, { timestamps: true }),
);

/** Read through `.lean<CallingBotCallRecord>()`. */
export const CallModel = mongoose.model(
  CALLING_BOT_CALL_MODEL,
  new Schema(CALLING_BOT_CALL_FIELDS, { timestamps: true }),
);

/** Connects to the portal's database, where the config and the calls live. */
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri);
}
