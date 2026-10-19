import type { Types } from 'mongoose';
import {
  backfillPhoneFields,
  migratePhoneProvider,
} from '../../../../src/modules/calling-bot-demo/calling-bot.migrations';
import { CallingBotConfigModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { configInput, credential } from './callingBot.fixtures';

/** A config as an older release stored it: written raw, without the fields named in `missing`. */
async function insertOld(fields: Record<string, unknown>, missing: string[] = []) {
  const doc: Record<string, unknown> = {
    ...configInput(),
    ticketSecret: credential('ticket'),
    isActive: false,
    ...fields,
  };
  for (const field of missing) {
    delete doc[field];
  }
  const { insertedId } = await CallingBotConfigModel.collection.insertOne(doc);
  return insertedId;
}

const rawOf = (_id: Types.ObjectId) => CallingBotConfigModel.collection.findOne({ _id });

describe('migratePhoneProvider', () => {
  it('keeps Vobiz for configs with its Auth ID, offers the rest browser calls only', async () => {
    const withVobiz = await insertOld({ vobizAuthId: 'MA1' }, ['phoneProvider']);
    const blankVobiz = await insertOld({ vobizAuthId: '' }, ['phoneProvider']);
    const noVobiz = await insertOld({}, ['phoneProvider', 'vobizAuthId']);
    const chosen = await insertOld({ phoneProvider: 'TWILIO', vobizAuthId: 'MA2' });

    await migratePhoneProvider();

    expect((await rawOf(withVobiz))?.phoneProvider).toBe('VOBIZ');
    expect((await rawOf(blankVobiz))?.phoneProvider).toBe('NONE');
    expect((await rawOf(noVobiz))?.phoneProvider).toBe('NONE');
    expect((await rawOf(chosen))?.phoneProvider).toBe('TWILIO');
  });
});

describe('backfillPhoneFields', () => {
  it('gives every missing phone field an empty string and leaves filled ones', async () => {
    const id = await insertOld({ vobizAuthId: 'MA1' }, [
      'twilioAccountSid',
      'twilioAuthToken',
      'twilioNumber',
      'vobizNumber',
    ]);

    await backfillPhoneFields();

    expect(await rawOf(id)).toMatchObject({
      vobizAuthId: 'MA1',
      vobizNumber: '',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioNumber: '',
    });
  });
});
