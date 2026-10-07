import type { OrgPerson } from '../../../../src/pages/org-chart';

/** One person as the `orgChart` query returns them. */
export function orgPerson(
  id: string,
  name: string,
  managerId: string | null = null,
  over: Partial<OrgPerson> = {},
): OrgPerson {
  return { id, name, managerId, designation: null, department: null, avatarUrl: null, ...over };
}

/** Maya runs the company; Asha reports to her, Chen to Asha and Dev to Chen. Omar is unplaced. */
export const COMPANY: OrgPerson[] = [
  orgPerson('m', 'Maya Iyer', null, { designation: 'CEO', department: 'Leadership' }),
  orgPerson('a', 'Asha', 'm', { avatarUrl: 'https://img.example.com/asha.png' }),
  orgPerson('c', 'Chen', 'a', { department: 'Platform' }),
  orgPerson('d', 'Dev', 'c'),
  orgPerson('o', 'Omar'),
];
