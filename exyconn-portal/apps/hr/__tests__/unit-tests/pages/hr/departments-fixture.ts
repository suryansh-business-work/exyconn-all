import type { DepartmentRow } from '../../../../src/pages/hr/forms/department';
import type { PositionRow } from '../../../../src/pages/hr/forms/position';

/** An open, fully described position. */
export const engineer: PositionRow = {
  id: 'pos-1',
  name: 'Software Engineer',
  department: 'Engineering',
  code: 'SE2',
  description: 'Builds the product',
  minSalary: 50000,
  maxSalary: 90000,
  grade: 'G3',
  employmentType: 'FULL_TIME',
  headcount: 3,
  filled: 2,
  active: true,
};

/** A closed position with none of the optional fields set. */
export const intern: PositionRow = {
  id: 'pos-2',
  name: 'Intern',
  department: 'Engineering',
  code: null,
  description: null,
  minSalary: 10000,
  maxSalary: 15000,
  grade: null,
  employmentType: null,
  headcount: 2,
  filled: 1,
  active: false,
};

/** A department with a head, a code, a description and two positions. */
export const engineering: DepartmentRow = {
  id: 'dep-1',
  name: 'Engineering',
  code: 'ENG',
  description: 'Everyone who builds',
  headId: 'u1',
  headName: 'Maya Iyer',
  positions: [engineer, intern],
};

/** A bare department: no head, no code, no description, no positions. */
export const sales: DepartmentRow = {
  id: 'dep-2',
  name: 'Sales',
  code: null,
  description: null,
  headId: null,
  headName: null,
  positions: [],
};
