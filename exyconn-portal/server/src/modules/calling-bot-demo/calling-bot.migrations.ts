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
