import { describe, it, expect } from 'vitest';
import { positionSchema } from '../../src/pages/hr/forms/position/position.schema';

const valid = {
  name: 'Software Engineer',
  department: 'Engineering',
  code: 'SE',
  description: '',
  minSalary: 50000,
  maxSalary: 90000,
  grade: '',
  employmentType: '',
  headcount: 3,
  active: true,
};

describe('positionSchema', () => {
  it('accepts a position with a band that runs upwards', () => {
    expect(positionSchema.safeParse(valid).success).toBe(true);
  });

  it('refuses a maximum salary below the minimum, on the maximum field', () => {
    const result = positionSchema.safeParse({ ...valid, minSalary: 90000, maxSalary: 50000 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['maxSalary']);
  });

  it('requires a name and a department', () => {
    const result = positionSchema.safeParse({ ...valid, name: ' ', department: '' });
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(['name', 'department']);
  });

  it('refuses a fractional or negative headcount', () => {
    expect(positionSchema.safeParse({ ...valid, headcount: 1.5 }).success).toBe(false);
    expect(positionSchema.safeParse({ ...valid, headcount: -1 }).success).toBe(false);
  });
});
