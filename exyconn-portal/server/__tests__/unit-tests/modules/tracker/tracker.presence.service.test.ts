import { Types } from 'mongoose';
import { TrackerAccessModel } from '../../../../src/modules/tracker/models';
import { TRACKER_MESSAGE_LIMITS } from '../../../../src/modules/tracker/tracker.constants';
import { presenceOf, setPresence } from '../../../../src/modules/tracker/tracker.presence.service';

async function granted() {
  const userId = new Types.ObjectId().toHexString();
  await TrackerAccessModel.create({ userId, grantedBy: 'admin' });
  return userId;
}

describe('setPresence', () => {
  it('stores an empty note when the employee gives none', async () => {
    const userId = await granted();

    const presence = await setPresence(userId, 'BREAK');

    expect(presence).toMatchObject({ status: 'BREAK', note: '' });
    const stored = await TrackerAccessModel.findOne({ userId }).lean();
    expect(stored?.presenceNote).toBe('');
  });

  it('keeps the note to a title length and trims what is left', async () => {
    const userId = await granted();
    const long = `  ${'m'.repeat(TRACKER_MESSAGE_LIMITS.maxTitleChars + 40)}`;

    const presence = await setPresence(userId, 'MEETING', long);

    expect(presence.note).toBe('m'.repeat(TRACKER_MESSAGE_LIMITS.maxTitleChars - 2));
  });

  it('can go back to working after a break', async () => {
    const userId = await granted();
    await setPresence(userId, 'LUNCH', 'back at 2');

    const presence = await setPresence(userId, 'WORKING', null);

    expect(presence).toMatchObject({ status: 'WORKING', note: '' });
  });

  it('refuses an employee who never had a grant', async () => {
    await expect(setPresence(new Types.ObjectId().toHexString(), 'AWAY')).rejects.toThrow(
      'Your tracker access has been revoked.',
    );
  });
});

describe('presenceOf', () => {
  it('reads back exactly what a stored row says', () => {
    const at = new Date('2026-09-04T12:00:00.000Z');

    expect(presenceOf({ presence: 'LUNCH', presenceNote: 'canteen', presenceAt: at })).toEqual({
      status: 'LUNCH',
      note: 'canteen',
      since: at,
    });
  });

  it('treats nulls written by an older client as never said', () => {
    expect(presenceOf({ presence: null, presenceNote: null, presenceAt: null })).toEqual({
      status: 'WORKING',
      note: '',
      since: null,
    });
  });
});
