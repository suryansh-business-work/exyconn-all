/**
 * The fixed choices Northstar's workflows offer: budget bands, start timelines, meeting
 * formats, support issue types and ticket priorities.
 */
export const BUDGETS = [
  { id: 'lean', title: 'Under ₹5 lakh' },
  { id: 'mid', title: '₹5 – 20 lakh' },
  { id: 'large', title: 'Above ₹20 lakh' },
] as const;

export const TIMELINES = [
  { id: 'asap', title: 'As soon as possible', description: 'Kick-off within two weeks' },
  { id: 'quarter', title: 'In 1–3 months', description: 'Planning for next quarter' },
  { id: 'flexible', title: 'Flexible', description: 'Still exploring options' },
] as const;

export const ISSUE_TYPES = [
  { id: 'bug', title: 'Something is broken', description: 'A feature fails or shows an error' },
  { id: 'outage', title: 'Site or app is down', description: 'Users cannot reach the product' },
  { id: 'change', title: 'Change request', description: 'New feature or a content update' },
  { id: 'access', title: 'Access or accounts', description: 'Logins, roles, keys or domains' },
  { id: 'billing', title: 'Invoices and billing', description: 'Invoices, PO numbers, GST' },
] as const;

export const MEET_MODES = [
  { id: 'video', title: 'Video call', label: 'Video call (link in your invite)' },
  { id: 'office', title: 'At our office', label: 'In person at Northstar, Baner' },
  { id: 'phone', title: 'Phone call', label: 'Phone call to your number' },
] as const;

export const PRIORITIES = [
  { id: 'p1', title: 'Critical', label: 'P1 · Critical', sla: '30 minutes' },
  { id: 'p2', title: 'High', label: 'P2 · High', sla: '4 business hours' },
  { id: 'p3', title: 'Normal', label: 'P3 · Normal', sla: '1 business day' },
] as const;
