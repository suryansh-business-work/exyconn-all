import { randomUUID } from 'node:crypto';
import { authService } from '../../src/modules/auth/auth.service';
import { UserModel } from '../../src/modules/admin/user.model';
import {
  ONLINE_WINDOW_MS,
  isOnline,
  presenceResolvers,
  recordActivity,
  resetPresenceThrottle,
} from '../../src/modules/admin/presence';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

async function person() {
  return seedUser(`${randomUUID()}@exyconn.com`, randomUUID(), [ROLES.EMPLOYEE]);
}

describe('own profile details', () => {
  it('saves a bio, a phone and shared links, and clears them with empty strings', async () => {
    const user = await person();
    const saved = await authService.updateProfile(user.id, {
      brief: '  Builds the tracker.  ',
      phone: '+91 (98765) 43210',
      socialLinks: { linkedin: 'https://linkedin.com/in/asha', github: '', website: undefined },
    });
    expect(saved).toMatchObject({
      brief: 'Builds the tracker.',
      phone: '+91 (98765) 43210',
      socialLinks: { linkedin: 'https://linkedin.com/in/asha', github: null, website: null },
    });

    const cleared = await authService.updateProfile(user.id, { brief: '', phone: '' });
    expect(cleared).toMatchObject({ brief: null, phone: null });
    expect(cleared.socialLinks?.linkedin).toBe('https://linkedin.com/in/asha');
  });

  it('refuses a bio that is too long, a malformed phone and a link that is not a web address', async () => {
    const user = await person();
    await expect(authService.updateProfile(user.id, { brief: 'x'.repeat(601) })).rejects.toThrow(
      /at most 600/,
    );
    await expect(authService.updateProfile(user.id, { phone: '12ab' })).rejects.toThrow(
      /phone number/,
    );
    await expect(
      authService.updateProfile(user.id, { socialLinks: { github: 'javascript:alert(1)' } }),
    ).rejects.toThrow(/github link/);
  });
});

describe('presence', () => {
  beforeEach(() => resetPresenceThrottle());

  it('is online only within the window after the last activity', () => {
    const now = Date.now();
    expect(isOnline(new Date(now - 1000), now)).toBe(true);
    expect(isOnline(new Date(now - ONLINE_WINDOW_MS), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
    expect(presenceResolvers.User.isOnline({ lastActiveAt: new Date() })).toBe(true);
  });

  it('records activity at most once a minute per person', async () => {
    const user = await person();
    const first = Date.now();
    await recordActivity(user.id, first);
    await recordActivity(user.id, first + 30_000);
    expect((await UserModel.findById(user.id).lean())?.lastActiveAt?.getTime()).toBe(first);

    await recordActivity(user.id, first + 61_000);
    expect((await UserModel.findById(user.id).lean())?.lastActiveAt?.getTime()).toBe(
      first + 61_000,
    );
  });
});
