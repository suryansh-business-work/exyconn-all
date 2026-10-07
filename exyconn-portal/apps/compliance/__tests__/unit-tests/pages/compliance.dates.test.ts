import { describe, expect, it } from 'vitest';
import { optionalPickedDate, pickedDate } from '../../../src/pages/compliance.dates';

const ISO = '2026-04-15T00:00:00.000Z';

describe('pickedDate', () => {
  const schema = pickedDate('Say when');

  it('takes the Date a form starts with, and the ISO string the picker writes back', () => {
    const start = new Date(ISO);
    expect(schema.parse(start)).toEqual(start);
    expect(schema.parse(ISO)).toEqual(new Date(ISO));
  });

  it('refuses a cleared or half-typed picker with the field message', () => {
    for (const value of ['', 'tomorrow']) {
      const result = schema.safeParse(value);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Say when');
    }
  });
});

describe('optionalPickedDate', () => {
  const schema = optionalPickedDate();

  it('reads a cleared picker and a missing date as "no date"', () => {
    expect(schema.parse('')).toBeNull();
    expect(schema.parse(null)).toBeNull();
  });

  it('takes a Date or the picked ISO string', () => {
    expect(schema.parse(ISO)).toEqual(new Date(ISO));
    expect(schema.parse(new Date(ISO))).toEqual(new Date(ISO));
  });

  it('refuses text that is no date at all', () => {
    expect(schema.safeParse('tomorrow').success).toBe(false);
  });
});
