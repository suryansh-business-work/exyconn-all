import { describe, expect, it } from 'vitest';
import { PRESENCE_OPTIONS, isAwayPresence, presenceLabel } from './presence';

describe('presence', () => {
  it('treats every status but Working as away, so lunch can never be billed as work', () => {
    expect(isAwayPresence('WORKING')).toBe(false);
    for (const option of PRESENCE_OPTIONS.filter((entry) => entry.status !== 'WORKING')) {
      expect(isAwayPresence(option.status)).toBe(true);
    }
  });

  it('offers Working first, because it is where a working day starts', () => {
    expect(PRESENCE_OPTIONS[0].status).toBe('WORKING');
  });

  it('says what each choice does to tracking before it is chosen', () => {
    expect(PRESENCE_OPTIONS.every((option) => option.caption !== '')).toBe(true);
  });

  it('names a status the same way wherever it is shown', () => {
    expect(presenceLabel('LUNCH')).toBe('On lunch');
  });
});
