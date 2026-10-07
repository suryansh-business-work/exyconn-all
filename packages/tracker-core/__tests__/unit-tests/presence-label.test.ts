import { describe, expect, it } from 'vitest';
import type { PresenceStatus } from '../../src/types';
import { isAwayPresence, presenceLabel } from '../../src/presence';

describe('presenceLabel', () => {
  it('labels each known presence', () => {
    expect(presenceLabel('LUNCH')).toBe('On lunch');
    expect(presenceLabel('MEETING')).toBe('In a meeting');
  });

  it('reads a status from a newer portal it does not know as Working', () => {
    // The status arrives over the network; a value added on the portal later must still render.
    const unknown = 'TRAINING' as PresenceStatus;
    expect(presenceLabel(unknown)).toBe('Working');
    expect(isAwayPresence(unknown)).toBe(true);
  });
});
