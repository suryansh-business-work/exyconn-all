import { describe, expect, it } from 'vitest';
import { byId } from '../../../src/seeds/education/counselling';
import { ALL_COURSES } from '../../../src/seeds/education/data';

describe('counselling course lookup', () => {
  it('finds a course by id', () => {
    expect(byId('jee')).toBe(ALL_COURSES.find((c) => c.id === 'jee'));
  });

  it('fails loudly for a course id that does not exist', () => {
    expect(() => byId('astrology')).toThrow('Unknown course astrology');
  });
});
