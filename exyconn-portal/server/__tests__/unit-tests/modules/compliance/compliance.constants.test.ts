import {
  MANAGEMENT_STANDARDS,
  objectiveAchievement,
  riskLevel,
} from '../../../../src/modules/compliance/compliance.constants';

describe('riskLevel band edges', () => {
  it('moves up a band exactly at 5, 10 and 15', () => {
    expect(riskLevel(4)).toBe('LOW');
    expect(riskLevel(5)).toBe('MEDIUM');
    expect(riskLevel(9)).toBe('MEDIUM');
    expect(riskLevel(10)).toBe('HIGH');
    expect(riskLevel(14)).toBe('HIGH');
    expect(riskLevel(15)).toBe('CRITICAL');
  });
});

describe('objectiveAchievement', () => {
  it('rounds part progress to a whole percentage', () => {
    // 0 -> 3, at 1: a third of the way.
    expect(objectiveAchievement(0, 3, 1)).toBe(33);
    expect(objectiveAchievement(0, 3, 2)).toBe(67);
  });

  it('holds a negative target when the actual stays at or below it', () => {
    // A target of -5 held at -5 asks the measure not to rise; going lower still holds it.
    expect(objectiveAchievement(-5, -5, -5)).toBe(100);
    expect(objectiveAchievement(-5, -5, -6)).toBe(100);
    expect(objectiveAchievement(-5, -5, -4)).toBe(0);
  });

  it('holds a zero target once the actual reaches it', () => {
    expect(objectiveAchievement(0, 0, 0)).toBe(100);
    expect(objectiveAchievement(0, 0, -1)).toBe(0);
  });
});

describe('the standards vocabulary', () => {
  it('names the four ISO management systems the registers serve', () => {
    expect(MANAGEMENT_STANDARDS).toEqual(['ISO_9001', 'ISO_27001', 'ISO_45001', 'ISO_14001']);
  });
});
