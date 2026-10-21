import { CallingBotConfigModel } from './calling-bot.models';

/**
 * Configs from before the phone provider could be chosen rang through Vobiz whenever its
 * fields were filled in. They keep doing so; the rest offer browser calls only.
 */
export async function migratePhoneProvider(): Promise<void> {
  const unset = { phoneProvider: { $exists: false } };
  await CallingBotConfigModel.updateMany(
    { ...unset, vobizAuthId: { $nin: ['', null] } },
    { $set: { phoneProvider: 'VOBIZ' } },
  );
  await CallingBotConfigModel.updateMany(unset, { $set: { phoneProvider: 'NONE' } });
}

/** The phone account fields, added after the first configs were saved. */
const PHONE_FIELDS = [
  'vobizAuthId',
  'vobizAuthToken',
  'vobizNumber',
  'twilioAccountSid',
  'twilioAuthToken',
  'twilioNumber',
] as const;

/**
 * Configs saved before a phone field existed have no value for it, and lean reads skip schema
 * defaults, so the field reached GraphQL as null (a non-null `String!`) and failed the whole
 * Calling bot list. Each missing field gets its schema default, an empty string.
 */
export async function backfillPhoneFields(): Promise<void> {
  // Each update fills a different field, so they run side by side.
  await Promise.all(
    PHONE_FIELDS.map((field) =>
      CallingBotConfigModel.updateMany({ [field]: null }, { $set: { [field]: '' } }),
    ),
  );
}
