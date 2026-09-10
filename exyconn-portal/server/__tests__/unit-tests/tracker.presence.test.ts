import { Types } from 'mongoose';
import { TrackerAccessModel } from '../../src/modules/tracker/models';
import {
  isAwayPresence,
  presenceOf,
  setPresence,
} from '../../src/modules/tracker/tracker.presence.service';

const ADMIN = new Types.ObjectId().toString();

async function granted(active = true) {
  const userId = new Types.ObjectId().toString();
  await TrackerAccessModel.create({ userId, grantedBy: ADMIN, isActive: active });
  return userId;
}

describe('tracker presence', () => {
  it('records what the employee said, and when they said it', async () => {
    const userId = await granted();

    const presence = await setPresence(userId, 'LUNCH', 'back at 2');

    expect(presence.status).toBe('LUNCH');
    expect(presence.note).toBe('back at 2');
    expect(presence.since).not.toBeNull();
  });

  it('refuses a revoked grant instead of quietly recording nothing', async () => {
    const userId = await granted(false);

    await expect(setPresence(userId, 'LUNCH', '')).rejects.toThrow(
      'Your tracker access has been revoked.',
    );
  });

  it('reads a grant written before presence existed as working', async () => {
    // `.lean()` skips schema defaults, so an older row comes back with no presence at all —
    // and a non-nullable GraphQL field would blow up on it.
    expect(presenceOf({}).status).toBe('WORKING');
    expect(presenceOf({}).since).toBeNull();
  });

  it('treats every status but working as away, so lunch is never billed as work', () => {
    expect(isAwayPresence('WORKING')).toBe(false);
    expect(isAwayPresence('LUNCH')).toBe(true);
    expect(isAwayPresence('BREAK')).toBe(true);
    expect(isAwayPresence('MEETING')).toBe(true);
    expect(isAwayPresence('AWAY')).toBe(true);
  });
});
