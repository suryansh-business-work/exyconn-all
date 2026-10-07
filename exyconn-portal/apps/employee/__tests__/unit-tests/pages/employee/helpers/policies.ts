import type { Policy } from '../../../../../src/pages/employee/PolicyCard';

const base: Policy = {
  id: '',
  title: '',
  slug: '',
  summary: '',
  body: '<p>Policy text</p>',
  version: 1,
  effectiveDate: '2026-01-01',
  requiresAcknowledgement: false,
  acknowledged: false,
  acknowledgedAt: null,
};

/** A policy the employee still has to sign. */
export const unsigned: Policy = {
  ...base,
  id: 'p1',
  title: 'Code of conduct',
  slug: 'code-of-conduct',
  summary: 'How we treat each other.',
  version: 2,
  requiresAcknowledgement: true,
};

/** A policy the employee has signed, and when. */
export const signed: Policy = {
  ...base,
  id: 'p2',
  title: 'Information security',
  slug: 'infosec',
  summary: 'Keep data safe.',
  version: 3,
  requiresAcknowledgement: true,
  acknowledged: true,
  acknowledgedAt: '2026-02-10',
};

/** A policy to read that asks for no signature. */
export const readOnly: Policy = {
  ...base,
  id: 'p3',
  title: 'Travel guidelines',
  slug: 'travel',
  summary: 'Booking trips.',
};
