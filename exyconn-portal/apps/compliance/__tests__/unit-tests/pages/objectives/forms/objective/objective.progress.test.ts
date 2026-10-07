import { describe, expect, it } from 'vitest';
import {
  achievement,
  achievementHint,
} from '../../../../../../src/pages/objectives/forms/objective/objective.progress';

describe('achievement', () => {
  it('measures the distance travelled from baseline to target, for a rise or a fall', () => {
    expect(achievement(0, 100, 40)).toBe(40);
    expect(achievement(20, 10, 15)).toBe(50);
    expect(achievement(20, 10, 10)).toBe(100);
  });

  it('clamps to 0-100 when the value has gone backwards or overshot', () => {
    expect(achievement(20, 10, 25)).toBe(0);
    expect(achievement(0, 10, 30)).toBe(100);
  });

  it('rounds to a whole percent', () => {
    expect(achievement(0, 3, 1)).toBe(33);
  });

  it('reports nothing achieved when the target asks for no movement', () => {
    expect(achievement(5, 5, 9)).toBe(0);
  });
});

describe('achievementHint', () => {
  it('reads the three figures as typed into the form', () => {
    expect(achievementHint('20', '10', '15')).toBe('50% of the way from 20 to 10');
  });

  it('treats a missing figure as zero', () => {
    expect(achievementHint(undefined, 10, undefined)).toBe('0% of the way from 0 to 10');
  });

  it('asks for a target that differs from the baseline', () => {
    expect(achievementHint(4, '4', 2)).toBe('Set a target that differs from the baseline');
    expect(achievementHint(null, null, null)).toBe('Set a target that differs from the baseline');
  });
});
